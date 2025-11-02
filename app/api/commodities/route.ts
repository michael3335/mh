/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/commodities/route.ts
import { NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * This endpoint:
 * - Loads history for commodities + AU proxies from S3
 * - Fetches fresh data from APIs (Alpha Vantage → FRED → Nasdaq Data Link)
 * - Updates S3 (append/repair)
 * - Returns AUD-based items & auItems (with sparkline + Δ/Δ%)
 *
 * Robustness:
 * - FX fallback: AV realtime → FRED DEXUSAL (USD per 1 AUD)
 * - Gold & others: AV → FRED → Nasdaq Data Link
 * - AU watchlist: US tickers (BHP/RIO/WDS/FSUGY/STOSF/XLE) + USD→AUD
 * - S3 completeness check: min points + freshness window
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
const S3_KEY = `${S3_PREFIX}/history.json`;

const s3 = new S3Client({ region: S3_REGION });

// history completeness settings
const MIN_POINTS = 30; // minimum number of points required per series
const FRESHNESS_DAYS = 10; // last point should be within this many days (or we consider stale)

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
    fred: { id: "GOLDAMGBD228NLBM" }, // London AM fix, USD
    nadl: { dataset: "LBMA/GOLD", column: "USD (AM)" }, // free on Nasdaq Data Link
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
    fred: { id: "DHHNGSP" }, // Henry Hub spot
  },
  {
    id: "copper",
    name: "Copper",
    unitUSD: "USD/mt",
    av: { func: "COPPER", interval: "monthly" }, // AV is monthly
    fred: { id: "PCOPPUSDM" }, // monthly, USD/mt
  },
  {
    id: "wheat",
    name: "Wheat",
    unitUSD: "USD/bu",
    av: { func: "WHEAT", interval: "daily" },
    // FRED global wheat price is USD/mt monthly (PWWTUSDM); keeping AV primary here
  },
  {
    id: "iron",
    name: "Iron Ore (62%)",
    unitUSD: "USD/t",
    fred: { id: "PIORECRUSDM" }, // Global Iron Ore price, USD/dmtu
  },
];

const AU_PROXIES = [
  { id: "bhp", symbol: "BHP", name: "BHP Group (NYSE)" },
  { id: "rio", symbol: "RIO", name: "Rio Tinto (NYSE)" },
  { id: "fmg", symbol: "FSUGY", name: "Fortescue (OTC ADR)" },
  { id: "wds", symbol: "WDS", name: "Woodside Energy (NYSE)" },
  { id: "sto", symbol: "STOSF", name: "Santos (OTC)" },
  { id: "fuel", symbol: "XLE", name: "Energy Select Sector SPDR" }, // proxy for FUEL.AX
];

/* -------------------- Shared utils -------------------- */

type SeriesPoint = { date: string; value: number };

type History = {
  [id: string]: { date: string; value: number }[];
};

const toISODate = (d = new Date()) => new Date(d).toISOString().slice(0, 10);
const isFiniteNum = (n: any): n is number => Number.isFinite(n);
const daysBetween = (a: string, b: string) =>
  Math.floor((+new Date(a) - +new Date(b)) / 86400000);

const usdToAud = (usd: number | null, audusd: number | null) =>
  usd != null && audusd && audusd > 0 ? usd / audusd : null;

function appendHistory(
  history: History,
  id: string,
  date: string,
  value: number | null,
  maxLen = 600
) {
  if (value == null || !Number.isFinite(value)) return history;
  const arr = history[id] ?? [];
  if (arr.length && arr[arr.length - 1].date === date) {
    arr[arr.length - 1].value = value;
  } else {
    arr.push({ date, value });
  }
  if (arr.length > maxLen) arr.splice(0, arr.length - maxLen);
  history[id] = arr;
  return history;
}

function computeDelta(values: number[]) {
  const last = values.at(-1) ?? null;
  const prev = values.length >= 2 ? values.at(-2)! : null;
  const change = last != null && prev != null ? last - prev : null;
  const changePct = last != null && prev ? ((last - prev) / prev) * 100 : null;
  return { last, prev, change, changePct };
}

function pickEffectiveSeries(
  s3Arr?: { date: string; value: number }[],
  providerArr?: { date: string; value: number }[]
) {
  const s3Has = Array.isArray(s3Arr) && s3Arr.length > 0;
  const providerHas = Array.isArray(providerArr) && providerArr.length > 0;
  if (s3Has) return s3Arr!;
  if (providerHas) return providerArr!;
  return [];
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

/* -------------------- Providers -------------------- */

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
    {
      file_type: "json",
      series_id,
      api_key: FRED_KEY,
      sort_order: "asc",
    }
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
  )}.json?${new URLSearchParams({
    api_key: NADL_KEY,
    order: "asc",
  })}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`NADL ${r.status}`);
  const j = await r.json();
  if (!j?.dataset?.data) throw new Error("NADL no data");
  return j;
}

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
    .map((d: any) => ({ date: String(d.date), value: Number(d.value) }))
    .filter((x) => isFiniteNum(x.value));
}

function fromFRED(j: any): SeriesPoint[] {
  return (j.observations as any[])
    .map((o) => ({ date: o.date as string, value: Number(o.value) }))
    .filter((x) => isFiniteNum(x.value));
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
    .map((row) => ({ date: row[0], value: Number(row[idx]) }))
    .filter((x) => isFiniteNum(x.value));
}

/* -------------------- Loaders -------------------- */

async function loadCommodityUSD(c: CSpec): Promise<SeriesPoint[]> {
  // 1) Alpha Vantage
  if (c.av) {
    try {
      const j = await avJson({ function: c.av.func, interval: c.av.interval });
      const s = fromAVCommodity(j);
      if (s.length) return s;
    } catch {}
  }
  // 2) FRED
  if (c.fred) {
    try {
      const j = await fredJson(c.fred.id);
      const s = fromFRED(j);
      if (s.length) return s;
    } catch {}
  }
  // 3) Nasdaq Data Link
  if (c.nadl) {
    try {
      const j = await nadlJson(c.nadl.dataset);
      const s = fromNADL(j, c.nadl.column);
      if (s.length) return s;
    } catch {}
  }
  return [];
}

async function loadUSQuoteAndSeries(symbol: string) {
  try {
    const [q, t] = await Promise.all([
      avJson({ function: "GLOBAL_QUOTE", symbol }),
      avJson({ function: "TIME_SERIES_DAILY", symbol, outputsize: "compact" }),
    ]);
    const g = q?.["Global Quote"] ?? {};
    const priceUSD = g["05. price"] ? Number(g["05. price"]) : null;
    const prevUSD = g["08. previous close"]
      ? Number(g["08. previous close"])
      : null;
    const ts = t?.["Time Series (Daily)"] || {};
    const seriesUSD = Object.entries(ts)
      .map(([date, o]: any) => ({ date, value: Number(o["4. close"]) }))
      .filter((x) => isFiniteNum(x.value))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-60);
    return { priceUSD, prevUSD, seriesUSD };
  } catch {
    return { priceUSD: null, prevUSD: null, seriesUSD: [] as SeriesPoint[] };
  }
}

/* -------------------- Completeness checks -------------------- */

function isSeriesFreshEnough(
  arr: { date: string; value: number }[],
  todayISO: string
): boolean {
  if (!arr?.length) return false;
  const lastDate = arr[arr.length - 1].date;
  return Math.abs(daysBetween(todayISO, lastDate)) <= FRESHNESS_DAYS;
}

function isComplete(
  arr?: { date: string; value: number }[],
  todayISO?: string
): boolean {
  if (!arr || arr.length < MIN_POINTS) return false;
  if (todayISO && !isSeriesFreshEnough(arr, todayISO)) return false;
  return true;
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

    // Load existing S3 history (or empty)
    const history: History = await getS3JSON<History>(S3_KEY, {});
    const today = toISODate();

    // FX (USD per 1 AUD)
    const audusd = await getAUDUSD();

    /* ---------- Commodities (USD → AUD, then store) ---------- */
    for (const c of COMMODITIES) {
      const current = history[c.id] || [];
      const ok = isComplete(current, today);
      if (!ok) {
        // seed/repair from providers
        const usd = await loadCommodityUSD(c);
        // keep provider series if FX missing (so we still have sparkline in USD)
        const provider = usd
          .map((p) => ({
            date: p.date,
            value: audusd ? (usdToAud(p.value, audusd) as number) : p.value,
          }))
          .filter((p) => isFiniteNum(p.value));

        // replace or merge with S3
        const merged = [...provider]; // provider is authoritative when (re)seeding
        history[c.id] = merged;
      }

      // Always append today's value if we can
      try {
        const usdSeries = await loadCommodityUSD(c);
        const lastUSD = usdSeries.at(-1)?.value ?? null;
        const lastConverted = audusd ? usdToAud(lastUSD, audusd) : lastUSD;
        appendHistory(history, c.id, today, lastConverted);
      } catch {
        // ignore
      }
    }

    /* ---------- AU Watchlist via US proxies (USD → AUD) ---------- */
    for (const p of AU_PROXIES) {
      const current = history[p.id] || [];
      const ok = isComplete(current, today);
      if (!ok) {
        const { seriesUSD } = await loadUSQuoteAndSeries(p.symbol);
        const provider = seriesUSD
          .map((sp) => ({
            date: sp.date,
            value: audusd ? (usdToAud(sp.value, audusd) as number) : sp.value,
          }))
          .filter((x) => isFiniteNum(x.value));
        history[p.id] = provider;
      }

      // append today's value
      try {
        const { priceUSD } = await loadUSQuoteAndSeries(p.symbol);
        const priceAUD = audusd ? usdToAud(priceUSD, audusd) : priceUSD ?? null;
        appendHistory(history, p.id, today, priceAUD);
      } catch {
        // ignore
      }
    }

    // Persist updates
    await putS3JSON(S3_KEY, history);

    /* ---------- Build response payloads ---------- */

    const items = COMMODITIES.map((c) => {
      const seriesArr = pickEffectiveSeries(history[c.id], undefined);
      const values = seriesArr.map((p) => p.value).slice(-30);
      const { last, prev, change, changePct } = computeDelta(values);
      const unit = audusd ? c.unitUSD.replace("USD/", "AUD/") : c.unitUSD;
      return {
        id: c.id,
        symbol: c.id.toUpperCase(),
        name: c.name,
        unit,
        price: last ?? null,
        prev,
        change,
        changePct,
        series: values,
      };
    });

    const auItems = await Promise.all(
      AU_PROXIES.map(async (p) => {
        const seriesArr = pickEffectiveSeries(history[p.id], undefined);
        const values = seriesArr.map((x) => x.value).slice(-30);
        // Try to refine last/prev with a live quote (does not affect stored history—already appended)
        let last = values.at(-1) ?? null;
        let prev = values.length >= 2 ? values.at(-2)! : null;

        try {
          const { priceUSD, prevUSD } = await loadUSQuoteAndSeries(p.symbol);
          const price = audusd ? usdToAud(priceUSD, audusd) : priceUSD ?? null;
          const prevLive = audusd ? usdToAud(prevUSD, audusd) : prevUSD ?? null;
          if (isFiniteNum(price)) last = price!;
          if (isFiniteNum(prevLive)) prev = prevLive!;
        } catch {
          // ignore, keep from history
        }

        const change = last != null && prev != null ? last - prev : null;
        const changePct =
          last != null && prev ? ((last - prev) / prev) * 100 : null;

        return {
          id: p.id,
          symbol: p.symbol,
          name: p.name,
          unit: audusd ? "AUD" : "USD",
          price: last ?? null,
          prev,
          change,
          changePct,
          series: values,
        };
      })
    );

    return NextResponse.json(
      {
        asof: Date.now(),
        base: audusd ? "AUD" : "USD",
        fx: { audusd }, // USD per 1 AUD (null if unavailable)
        items,
        auItems,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load commodities" },
      { status: 500 }
    );
  }
}
