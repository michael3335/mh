/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/commodities/route.ts
import { NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * Behavior:
 * - For each commodity, fetch **all** available history from all configured providers (AV → FRED → NADL),
 *   merge them with AV > FRED > NADL priority per date, and store USD-only to S3.
 * - On later runs, **append only new dates** (or upgrade if provider history extends further back).
 * - AU proxy tickers use AV TIME_SERIES_DAILY (full) for history; live quotes refine the response only.
 * - Response converts to AUD on-the-fly when an AUDUSD rate is available.
 */

export const runtime = "nodejs";
export const revalidate = 0;

/* -------------------- Config -------------------- */

const AV_KEY = process.env.ALPHA_VANTAGE_KEY || "";
const FRED_KEY = process.env.FRED_API_KEY || "";
const NADL_KEY = process.env.NADL_API_KEY || "";

const S3_REGION = process.env.AWS_S3_REGION || "ap-southeast-2";
const S3_BUCKET = process.env.AWS_S3_BUCKET || "";
const S3_PREFIX = (process.env.AWS_S3_PREFIX || "commodities").replace(
  /\/+$/,
  ""
);
const S3_KEY_USD = `${S3_PREFIX}/history_usd.json`;

const s3 = new S3Client({ region: S3_REGION });

// history completeness settings (used only for sanity checks)
const MIN_POINTS = 30;
const FRESHNESS_DAYS = 10;

/* -------------------- Universe -------------------- */

type CSpec = {
  id: string;
  name: string;
  unitUSD: string;
  av?: { func: string; interval: "daily" | "weekly" | "monthly" };
  fred?: { id: string };
  nadl?: { dataset: string; column?: string };
};

const COMMODITIES: CSpec[] = [
  {
    id: "gold",
    name: "Gold (LBMA)",
    unitUSD: "USD/oz",
    av: { func: "GOLD", interval: "daily" },
    fred: { id: "GOLDAMGBD228NLBM" },
    nadl: { dataset: "LBMA/GOLD", column: "USD (AM)" },
  },
  {
    id: "wti",
    name: "WTI Crude",
    unitUSD: "USD/bbl",
    av: { func: "WTI", interval: "daily" },
    fred: { id: "DCOILWTICO" },
  },
  {
    id: "brent",
    name: "Brent Crude",
    unitUSD: "USD/bbl",
    av: { func: "BRENT", interval: "daily" },
    fred: { id: "DCOILBRENTEU" },
  },
  {
    id: "natgas",
    name: "Natural Gas",
    unitUSD: "USD/MMBtu",
    av: { func: "NATURAL_GAS", interval: "daily" },
    fred: { id: "DHHNGSP" },
  },
  {
    id: "copper",
    name: "Copper",
    unitUSD: "USD/mt",
    av: { func: "COPPER", interval: "monthly" },
    fred: { id: "PCOPPUSDM" },
  },
  {
    id: "wheat",
    name: "Wheat",
    unitUSD: "USD/bu",
    av: { func: "WHEAT", interval: "daily" },
  },
  {
    id: "iron",
    name: "Iron Ore (62%)",
    unitUSD: "USD/t",
    fred: { id: "PIORECRUSDM" },
  }, // note: FRED series is USD/dmtu; we keep raw values + label
];

const AU_PROXIES = [
  { id: "bhp", symbol: "BHP", name: "BHP Group (NYSE)" },
  { id: "rio", symbol: "RIO", name: "Rio Tinto (NYSE)" },
  { id: "fmg", symbol: "FSUGY", name: "Fortescue (OTC ADR)" },
  { id: "wds", symbol: "WDS", name: "Woodside Energy (NYSE)" },
  { id: "sto", symbol: "STOSF", name: "Santos (OTC)" },
  { id: "fuel", symbol: "XLE", name: "Energy Select Sector SPDR" },
];

/* -------------------- Shared utils -------------------- */

type SeriesPoint = { date: string; value: number };
type History = { [id: string]: SeriesPoint[] };

const toISODate = (d = new Date()) => new Date(d).toISOString().slice(0, 10);
const isFiniteNum = (n: any): n is number => Number.isFinite(n);
const daysBetween = (a: string, b: string) =>
  Math.floor((+new Date(a) - +new Date(b)) / 86400000);
const usdToAud = (usd: number | null, audusd: number | null) =>
  usd != null && audusd && audusd > 0 ? usd / audusd : null;

function computeDelta(values: number[]) {
  const last = values.at(-1) ?? null;
  const prev = values.length >= 2 ? values.at(-2)! : null;
  const change = last != null && prev != null ? last - prev : null;
  const changePct =
    last != null && prev != null && prev !== 0
      ? ((last - prev) / prev) * 100
      : null;
  return { last, prev, change, changePct };
}

function isSeriesFreshEnough(arr: SeriesPoint[], todayISO: string): boolean {
  if (!arr?.length) return false;
  const lastDate = arr[arr.length - 1].date;
  return Math.abs(daysBetween(todayISO, lastDate)) <= FRESHNESS_DAYS;
}
function isComplete(arr?: SeriesPoint[], todayISO?: string): boolean {
  if (!arr || arr.length < MIN_POINTS) return false;
  if (todayISO && !isSeriesFreshEnough(arr, todayISO)) return false;
  return true;
}

/** Replace with provider if it's clearly more complete; otherwise append only newer points. Returns true if mutated. */
function upsertSeriesWithProvider(
  history: History,
  id: string,
  providerAsc: SeriesPoint[],
  maxLen = 600
): boolean {
  const clean = providerAsc
    .filter((p) => isFiniteNum(p.value))
    .sort((a: SeriesPoint, b: SeriesPoint) => a.date.localeCompare(b.date));
  const curr = history[id] ?? [];
  // Seed or upgrade if provider has more coverage (earlier start or longer length)
  if (
    curr.length === 0 ||
    clean.length > curr.length ||
    (clean[0] && curr[0] && clean[0].date < curr[0].date)
  ) {
    history[id] = clean.slice(-maxLen);
    return true;
  }
  // Append only newer dates
  const lastDate = curr.at(-1)?.date ?? "";
  let changed = false;
  for (const p of clean) {
    if (p.date > lastDate && isFiniteNum(p.value)) {
      curr.push(p);
      changed = true;
    }
  }
  if (curr.length > maxLen) curr.splice(0, curr.length - maxLen);
  history[id] = curr;
  return changed;
}

/* -------------------- S3 helpers -------------------- */

async function getS3JSON<T>(Key: string, fallback: T): Promise<T> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key }));
    // @ts-ignore - Node >=18 has transformToString
    const body = await res.Body?.transformToString?.("utf-8");
    return body ? (JSON.parse(body) as T) : fallback;
  } catch {
    return fallback;
  }
}
async function putS3JSON(Key: string, obj: any) {
  const Body = JSON.stringify(obj);
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key,
      Body,
      ContentType: "application/json",
    })
  );
}

/* -------------------- Providers (with per-request caches) -------------------- */

const usdSeriesCache = new Map<string, SeriesPoint[]>(); // commodities by id (merged full)
const usQuoteCache = new Map<
  string,
  { priceUSD: number | null; prevUSD: number | null; seriesUSD: SeriesPoint[] }
>();

async function avJson(params: Record<string, string>) {
  if (!AV_KEY) throw new Error("Missing ALPHA_VANTAGE_KEY");
  const url = `https://www.alphavantage.co/query?${new URLSearchParams({
    ...params,
    apikey: AV_KEY,
  })}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`AV ${r.status}`);
  const j = await r.json();
  if (j?.Note || j?.Information) throw new Error("Alpha Vantage rate limited");
  return j;
}
async function fredJson(series_id: string) {
  if (!FRED_KEY) throw new Error("Missing FRED_API_KEY");
  const url = `https://api.stlouisfed.org/fred/series/observations?${new URLSearchParams(
    { file_type: "json", series_id, api_key: FRED_KEY, sort_order: "asc" }
  )}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`FRED ${r.status}`);
  const j = await r.json();
  if (!j?.observations) throw new Error("FRED no observations");
  return j;
}
async function nadlJson(dataset: string) {
  if (!NADL_KEY) throw new Error("Missing NADL_API_KEY");
  const url = `https://data.nasdaq.com/api/v3/datasets/${encodeURIComponent(
    dataset
  )}.json?${new URLSearchParams({ api_key: NADL_KEY, order: "asc" })}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`NADL ${r.status}`);
  const j = await r.json();
  if (!j?.dataset?.data) throw new Error("NADL no data");
  return j;
}

/* -------------------- FX -------------------- */

async function getAUDUSD(): Promise<number | null> {
  // 1) AV realtime
  try {
    const j = await avJson({
      function: "CURRENCY_EXCHANGE_RATE",
      from_currency: "AUD",
      to_currency: "USD",
    });
    const v = j?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
    if (v) return Number(v);
  } catch {}
  // 2) FRED fallback (DEXUSAL: USD per 1 AUD)
  try {
    const j = await fredJson("DEXUSAL");
    const obs = j?.observations ?? [];
    const last = obs.length ? Number(obs[obs.length - 1].value) : null;
    if (isFiniteNum(last)) return last;
  } catch {}
  return null;
}

/* -------------------- Normalizers -------------------- */

function fromAVCommodity(j: any): SeriesPoint[] {
  const arr = j?.data ?? [];
  return arr
    .map(
      (d: any): SeriesPoint => ({
        date: String(d.date),
        value: Number(d.value),
      })
    )
    .filter((p: SeriesPoint) => isFiniteNum(p.value))
    .sort((a: SeriesPoint, b: SeriesPoint) => a.date.localeCompare(b.date));
}
function fromFRED(j: any): SeriesPoint[] {
  return (j.observations as any[])
    .map((o): SeriesPoint => ({ date: String(o.date), value: Number(o.value) }))
    .filter((p: SeriesPoint) => isFiniteNum(p.value))
    .sort((a: SeriesPoint, b: SeriesPoint) => a.date.localeCompare(b.date));
}
function fromNADL(j: any, column?: string): SeriesPoint[] {
  const cols: string[] = j.dataset.column_names || [];
  const data: any[][] = j.dataset.data || [];
  let idx = 1;
  if (column) {
    const found = cols.findIndex(
      (c) => c.toLowerCase() === column.toLowerCase()
    );
    if (found > 0) idx = found;
  }
  return data
    .map(
      (row): SeriesPoint => ({ date: String(row[0]), value: Number(row[idx]) })
    )
    .filter((p: SeriesPoint) => isFiniteNum(p.value))
    .sort((a: SeriesPoint, b: SeriesPoint) => a.date.localeCompare(b.date));
}

/* -------------------- Merge helpers (use ALL providers for EVERY commodity) -------------------- */

function mergeByDatePriority(sources: SeriesPoint[][]): SeriesPoint[] {
  // Priority: index order (0 highest). We’ll pass [AV, FRED, NADL]
  const map = new Map<string, number>();
  for (const src of sources) {
    for (const p of src) {
      if (!map.has(p.date)) map.set(p.date, p.value);
    }
  }
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a: SeriesPoint, b: SeriesPoint) => a.date.localeCompare(b.date));
}

async function loadCommodityUSDAll(c: CSpec): Promise<SeriesPoint[]> {
  const [av, fred, nadl] = await Promise.all([
    (async () => {
      if (!c.av) return [] as SeriesPoint[];
      try {
        const j = await avJson({
          function: c.av.func,
          interval: c.av.interval,
        });
        return fromAVCommodity(j);
      } catch {
        return [];
      }
    })(),
    (async () => {
      if (!c.fred) return [] as SeriesPoint[];
      try {
        const j = await fredJson(c.fred.id);
        return fromFRED(j);
      } catch {
        return [];
      }
    })(),
    (async () => {
      if (!c.nadl) return [] as SeriesPoint[];
      try {
        const j = await nadlJson(c.nadl.dataset);
        return fromNADL(j, c.nadl.column);
      } catch {
        return [];
      }
    })(),
  ]);
  // Priority AV > FRED > NADL
  return mergeByDatePriority([av, fred, nadl]);
}

/* Cache the merged full history per commodity within the request */
async function getUSDSeriesMerged(c: CSpec): Promise<SeriesPoint[]> {
  if (!usdSeriesCache.has(c.id)) {
    usdSeriesCache.set(c.id, await loadCommodityUSDAll(c));
  }
  return usdSeriesCache.get(c.id)!;
}

/* -------------------- AU proxies (full history + quote) -------------------- */

async function loadUSQuoteAndSeries(symbol: string) {
  try {
    const [q, t] = await Promise.all([
      avJson({ function: "GLOBAL_QUOTE", symbol }),
      avJson({ function: "TIME_SERIES_DAILY", symbol, outputsize: "full" }),
    ]);
    const g = q?.["Global Quote"] ?? {};
    const priceUSD = g["05. price"] ? Number(g["05. price"]) : null;
    const prevUSD = g["08. previous close"]
      ? Number(g["08. previous close"])
      : null;
    const ts = (t?.["Time Series (Daily)"] || {}) as Record<string, any>;
    const seriesUSD: SeriesPoint[] = (Object.entries(ts) as [string, any][])
      .map(([date, o]) => ({ date, value: Number(o["4. close"]) }))
      .filter((p) => isFiniteNum(p.value))
      .sort((a: SeriesPoint, b: SeriesPoint) => a.date.localeCompare(b.date));
    return { priceUSD, prevUSD, seriesUSD };
  } catch {
    return { priceUSD: null, prevUSD: null, seriesUSD: [] as SeriesPoint[] };
  }
}
async function getUSQuote(sym: string) {
  if (!usQuoteCache.has(sym)) {
    usQuoteCache.set(sym, await loadUSQuoteAndSeries(sym));
  }
  return usQuoteCache.get(sym)!;
}

/* -------------------- Main handler -------------------- */

export async function GET() {
  try {
    if (!S3_BUCKET) {
      return NextResponse.json(
        { error: "Missing AWS_S3_BUCKET" },
        { status: 500 }
      );
    }

    // Load existing S3 USD history (or empty)
    const historyUSD: History = await getS3JSON<History>(S3_KEY_USD, {});
    const origSerialized = JSON.stringify(historyUSD);
    const today = toISODate();

    // FX (USD per 1 AUD)
    const audusd = await getAUDUSD();

    /* ---------- Commodities: FULL merged history for ALL, then append-only ---------- */
    for (const c of COMMODITIES) {
      const mergedFull = await getUSDSeriesMerged(c); // AV ∪ FRED ∪ NADL
      upsertSeriesWithProvider(historyUSD, c.id, mergedFull);
    }

    /* ---------- AU proxies: full equity history (AV), then append-only ---------- */
    for (const p of AU_PROXIES) {
      const { seriesUSD } = await getUSQuote(p.symbol); // full history asc
      upsertSeriesWithProvider(historyUSD, p.id, seriesUSD);
      // We do not store live quote rows with 'today' unless they exist in the time series.
    }

    // Persist updates only if changed
    const newSerialized = JSON.stringify(historyUSD);
    if (newSerialized !== origSerialized) {
      await putS3JSON(S3_KEY_USD, historyUSD);
    }

    /* ---------- Build response payloads (AUD on-the-fly if possible) ---------- */

    const base = audusd ? ("AUD" as const) : ("USD" as const);

    const items = COMMODITIES.map((c) => {
      const seriesUSD = (historyUSD[c.id] ?? []).map((p) => p.value);
      const seriesOut = audusd
        ? seriesUSD.map((v) => usdToAud(v, audusd)!)
        : seriesUSD;
      const last30 = seriesOut.slice(-30);
      const { last, prev, change, changePct } = computeDelta(last30);
      const unit =
        base === "AUD" ? c.unitUSD.replace("USD/", "AUD/") : c.unitUSD;

      return {
        id: c.id,
        symbol: c.id.toUpperCase(),
        name: c.name,
        unit,
        price: last ?? null,
        prev,
        change,
        changePct,
        series: last30,
      };
    });

    const auItems = await Promise.all(
      AU_PROXIES.map(async (p) => {
        const valuesUSD = (historyUSD[p.id] ?? []).map((x) => x.value);
        const valuesOut = audusd
          ? valuesUSD.map((v) => usdToAud(v, audusd)!)
          : valuesUSD;
        const last30 = valuesOut.slice(-30);

        // Refine latest/prev with live quote (not stored)
        let last = last30.at(-1) ?? null;
        let prev = last30.length >= 2 ? last30.at(-2)! : null;

        try {
          const { priceUSD, prevUSD } = await getUSQuote(p.symbol);
          const price = audusd ? usdToAud(priceUSD, audusd) : priceUSD ?? null;
          const prevLive = audusd ? usdToAud(prevUSD, audusd) : prevUSD ?? null;
          if (isFiniteNum(price)) last = price!;
          if (isFiniteNum(prevLive)) prev = prevLive!;
        } catch {}

        const change = last != null && prev != null ? last - prev : null;
        const changePct =
          last != null && prev != null && prev !== 0
            ? ((last - prev) / prev) * 100
            : null;

        return {
          id: p.id,
          symbol: p.symbol,
          name: p.name,
          unit: base,
          price: last ?? null,
          prev,
          change,
          changePct,
          series: last30,
        };
      })
    );

    return NextResponse.json(
      { asof: Date.now(), base, fx: { audusd }, items, auItems },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load commodities" },
      { status: 500 }
    );
  }
}
