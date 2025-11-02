// app/api/commodities/route.ts
import { NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const revalidate = 0;

/**
 * Data strategy:
 * - For commodities (USD): try Alpha Vantage → FRED → Nasdaq Data Link (Quandl).
 * - Convert to AUD via AV realtime AUDUSD (USD per 1 AUD).
 * - For AU watchlist: use US-traded proxies (free on AV) and convert USD→AUD.
 * - Persist history in S3: we keep a per-item time series (date,value[AUD]) and append.
 */

/* -------------------- Config & helpers -------------------- */

const AV_KEY = process.env.ALPHA_VANTAGE_KEY || "";
const FRED_KEY = process.env.FRED_API_KEY || "";
const NADL_KEY = process.env.NADL_API_KEY || "";

const S3_REGION = process.env.AWS_S3_REGION || "ap-southeast-2";
const S3_BUCKET = process.env.AWS_S3_BUCKET!;
const S3_PREFIX = (process.env.AWS_S3_PREFIX || "commodities").replace(
  /\/+$/,
  ""
);
const S3_KEY = `${S3_PREFIX}/history.json`;

const s3 = new S3Client({ region: S3_REGION });

async function getS3JSON<T>(Key: string, fallback: T): Promise<T> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key }));
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

// USD → AUD; AV gives USD per 1 AUD; AUD = USD / AUDUSD
const usdToAud = (usd: number | null, audusd: number | null) =>
  usd != null && audusd && audusd > 0 ? usd / audusd : null;

const toISODate = (d = new Date()) => new Date(d).toISOString().slice(0, 10);

/* -------------------- Universe -------------------- */

/** Commodities: prefer daily series where possible */
type CSpec = {
  id: string;
  name: string;
  unitUSD: string; // used to flip USD/ → AUD/
  // Alpha Vantage function & interval if exists
  av?: { func: string; interval: "daily" | "weekly" | "monthly" };
  // FRED series id (daily/monthly)
  fred?: { id: string };
  // Nasdaq Data Link dataset code and column name to use
  nadl?: { dataset: string; column?: string }; // e.g., LBMA/GOLD, column "USD (AM)"
};

const COMMODITIES: CSpec[] = [
  {
    id: "gold",
    name: "Gold (LBMA)",
    unitUSD: "USD/oz",
    av: { func: "GOLD", interval: "daily" },
    fred: { id: "GOLDAMGBD228NLBM" }, // London AM fix, USD
    nadl: { dataset: "LBMA/GOLD", column: "USD (AM)" },
  },
  {
    id: "wti",
    name: "WTI Crude",
    unitUSD: "USD/bbl",
    av: { func: "WTI", interval: "daily" },
    fred: { id: "DCOILWTICO" },
    // NADL: EIA datasets often premium; skip unless you have access
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
    av: { func: "COPPER", interval: "monthly" },
    fred: { id: "PCOPPUSDM" }, // Global price of Copper, monthly, USD/mt
  },
  {
    id: "wheat",
    name: "Wheat",
    unitUSD: "USD/bu",
    av: { func: "WHEAT", interval: "daily" },
    fred: { id: "PWWTUSDM" }, // Global price of Wheat, monthly USD/mt (note units differ)
  },
  {
    id: "iron",
    name: "Iron Ore (62%)",
    unitUSD: "USD/t",
    // no AV; use FRED / NADL
    fred: { id: "PIORECRUSDM" }, // Global price of Iron Ore, USD/dry metric ton
  },
];

/** AU watchlist → US-traded proxies (so AV works) */
const AU_PROXIES = [
  { id: "bhp", symbol: "BHP", name: "BHP Group (NYSE)" },
  { id: "rio", symbol: "RIO", name: "Rio Tinto (NYSE)" },
  { id: "fmg", symbol: "FSUGY", name: "Fortescue (OTC ADR)" },
  { id: "wds", symbol: "WDS", name: "Woodside Energy (NYSE)" },
  { id: "sto", symbol: "STOSF", name: "Santos (OTC)" },
  { id: "fuel", symbol: "XLE", name: "Energy Select Sector SPDR" }, // proxy for FUEL.AX
];

/* -------------------- Fetchers -------------------- */

async function avJson(params: Record<string, string>) {
  if (!AV_KEY) throw new Error("Missing ALPHA_VANTAGE_KEY");
  const url = `https://www.alphavantage.co/query?${new URLSearchParams({
    ...params,
    apikey: AV_KEY,
  })}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`AV ${r.status}`);
  const j = await r.json();
  // throttling returns a note field
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
  try {
    const j = await avJson({
      function: "CURRENCY_EXCHANGE_RATE",
      from_currency: "AUD",
      to_currency: "USD",
    });
    const v = j?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

/* ---- Commodity loaders with fallbacks ---- */

type SeriesPoint = { date: string; value: number };

function fromAVCommodity(j: any): SeriesPoint[] {
  // AV commodity endpoints return: { data: [{date, value}] }
  const arr = j?.data ?? [];
  return arr
    .map((d: any) => ({ date: String(d.date), value: Number(d.value) }))
    .filter((x: any) => Number.isFinite(x.value));
}

function fromFRED(j: any): SeriesPoint[] {
  return (j.observations as any[])
    .map((o) => ({ date: o.date as string, value: Number(o.value) }))
    .filter((x) => Number.isFinite(x.value));
}

function fromNADL(j: any, column?: string): SeriesPoint[] {
  const cols: string[] = j.dataset.column_names;
  const data: any[][] = j.dataset.data; // [[date, col1, col2...]]
  // pick column by name or default to the 1st numeric column
  let idx = 1;
  if (column) {
    const found = cols.findIndex(
      (c) => c.toLowerCase() === column.toLowerCase()
    );
    if (found > 0) idx = found;
  }
  return data
    .map((row) => ({ date: row[0], value: Number(row[idx]) }))
    .filter((x) => Number.isFinite(x.value));
}

async function loadCommoditySeries(c: CSpec): Promise<SeriesPoint[]> {
  // 1) AV
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
  // 3) NADL
  if (c.nadl) {
    try {
      const j = await nadlJson(c.nadl.dataset);
      const s = fromNADL(j, c.nadl.column);
      if (s.length) return s;
    } catch {}
  }
  return [];
}

function computeLastPrev(series: SeriesPoint[]) {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((x) => x.value);
  const last = values.at(-1) ?? null;
  const prev = values.length >= 2 ? values.at(-2)! : null;
  const change = last != null && prev != null ? last - prev : null;
  const changePct = last != null && prev ? ((last - prev) / prev) * 100 : null;
  return { last, prev, change, changePct, values };
}

/* ---- AU proxies via US tickers on AV ---- */

async function loadUSQuoteAndSeries(symbol: string) {
  try {
    const [q, t] = await Promise.all([
      avJson({ function: "GLOBAL_QUOTE", symbol }),
      avJson({ function: "TIME_SERIES_DAILY", symbol, outputsize: "compact" }),
    ]);
    const g = q?.["Global Quote"] ?? {};
    const price = g["05. price"] ? Number(g["05. price"]) : null;
    const prev = g["08. previous close"]
      ? Number(g["08. previous close"])
      : null;
    const change = price != null && prev != null ? price - prev : null;
    const changePct =
      price != null && prev ? ((price - prev) / prev) * 100 : null;

    const ts = t?.["Time Series (Daily)"] || {};
    const series = Object.entries(ts)
      .map(([date, o]: any) => ({ date, value: Number(o["4. close"]) }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map((x) => x.value)
      .filter((n) => Number.isFinite(n));

    return { price, prev, change, changePct, series };
  } catch {
    return {
      price: null,
      prev: null,
      change: null,
      changePct: null,
      series: [] as number[],
    };
  }
}

/* -------------------- S3 history structure -------------------- */

type History = {
  // itemId -> array of { date, valueAUD }
  [id: string]: { date: string; value: number }[];
};

function appendHistory(
  history: History,
  id: string,
  date: string,
  value: number | null,
  maxLen = 400
) {
  if (value == null || !Number.isFinite(value)) return history;
  const arr = history[id] ?? [];
  if (arr.length && arr[arr.length - 1].date === date) {
    arr[arr.length - 1].value = value;
  } else {
    arr.push({ date, value });
  }
  // clamp
  if (arr.length > maxLen) arr.splice(0, arr.length - maxLen);
  history[id] = arr;
  return history;
}

/* -------------------- Handler -------------------- */

export async function GET() {
  try {
    if (!S3_BUCKET)
      return NextResponse.json(
        { error: "Missing AWS_S3_BUCKET" },
        { status: 500 }
      );

    // Load existing history from S3
    const history: History = await getS3JSON<History>(S3_KEY, {});

    // AUDUSD for conversion
    const audusd = await getAUDUSD();

    // Commodities (USD → AUD)
    const today = toISODate();
    const commodityItems = await Promise.all(
      COMMODITIES.map(async (c) => {
        const seriesUSD = await loadCommoditySeries(c); // array of {date,value}
        const lastUSD = seriesUSD.at(-1)?.value ?? null;

        // Convert entire series to AUD for the sparkline
        const seriesAUD = seriesUSD
          .map((p) => ({ date: p.date, value: usdToAud(p.value, audusd) }))
          .filter((p): p is { date: string; value: number } =>
            Number.isFinite(p.value || NaN)
          );

        // Update S3 history with today's last value (AUD)
        const lastAUD = usdToAud(lastUSD, audusd);
        appendHistory(history, c.id, today, lastAUD);

        // Compute last/prev from AUD series (prefer S3 history to smooth different providers)
        const effectiveSeries = (history[c.id] ?? seriesAUD).map(
          (p) => p.value
        );
        const prev =
          effectiveSeries.length >= 2 ? effectiveSeries.at(-2)! : null;
        const last = effectiveSeries.at(-1) ?? null;
        const change = last != null && prev != null ? last - prev : null;
        const changePct =
          last != null && prev ? ((last - prev) / prev) * 100 : null;

        return {
          id: c.id,
          symbol: c.id.toUpperCase(),
          name: c.name,
          unit: c.unitUSD.replace("USD/", "AUD/"),
          price: last ?? null,
          prev,
          change,
          changePct,
          series: effectiveSeries.slice(-30), // short sparkline
        };
      })
    );

    // AU Watchlist via US proxies (USD → AUD)
    const auItems = await Promise.all(
      AU_PROXIES.map(async (p) => {
        const q = await loadUSQuoteAndSeries(p.symbol);
        // Convert
        const price = usdToAud(q.price, audusd);
        const prev = usdToAud(q.prev, audusd);
        const change = usdToAud(q.change, audusd);
        const seriesAud = q.series
          .map((v) => usdToAud(v, audusd) ?? v)
          .filter((n): n is number => Number.isFinite(n));

        // Update S3 history for proxies too
        appendHistory(history, p.id, today, price ?? null);

        const effectiveSeries = (
          history[p.id]?.map((x) => x.value) ?? seriesAud
        ).slice(-30);
        const last = effectiveSeries.at(-1) ?? null;
        const prevEff =
          effectiveSeries.length >= 2 ? effectiveSeries.at(-2)! : null;
        const changeEff =
          last != null && prevEff != null ? last - prevEff : null;
        const changePct =
          last != null && prevEff ? ((last - prevEff) / prevEff) * 100 : null;

        return {
          id: p.id,
          symbol: p.symbol,
          name: p.name,
          unit: "AUD",
          price: last ?? null,
          prev: prevEff,
          change: changeEff,
          changePct,
          series: effectiveSeries,
        };
      })
    );

    // Persist updated history to S3
    await putS3JSON(S3_KEY, history);

    return NextResponse.json(
      {
        asof: Date.now(),
        base: "AUD",
        fx: { audusd },
        items: commodityItems,
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
