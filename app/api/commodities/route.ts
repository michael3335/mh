// app/api/commodities/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

/**
 * Alpha Vantage (free) docs:
 * - Commodities (WTI, BRENT, NATURAL_GAS, COPPER, WHEAT...): function=<CODE>&interval=daily|weekly|monthly
 * - FX realtime AUD/USD: function=CURRENCY_EXCHANGE_RATE&from_currency=AUD&to_currency=USD
 *
 * Notes:
 * - Commodity endpoints are daily/weekly/monthly (no intraday). We use "daily" where supported,
 *   otherwise "monthly" (e.g., COPPER is monthly/quarterly/annual per docs).
 * - We compute last/prev/Δ/Δ% from the most recent two data points.
 * - We convert USD → AUD using the realtime AUDUSD rate (AUD = USD / AUDUSD).
 * - AU proxies (ASX: BHP/RIO/FM G/WDS/STO/FUEL.AX) are fetched via GLOBAL_QUOTE (current) +
 *   TIME_SERIES_DAILY (sparkline). If a symbol isn’t available in your key’s region coverage,
 *   we return nulls gracefully.
 */

const AV_KEY = process.env.ALPHA_VANTAGE_KEY!;
const AV_BASE = "https://www.alphavantage.co/query";

type Item = {
  id: string;
  symbol: string; // label
  name: string;
  unitHint?: string; // tells us if USD-based for conversion
  avFunc?: string; // Alpha Vantage commodity function code
  interval?: "daily" | "weekly" | "monthly";
};

// USD-based global commodities (we'll convert to AUD)
const COMMODITY_SYMBOLS: Item[] = [
  {
    id: "wti",
    symbol: "WTI",
    name: "WTI Crude",
    unitHint: "USD/bbl",
    avFunc: "WTI",
    interval: "daily",
  },
  {
    id: "brent",
    symbol: "BRENT",
    name: "Brent Crude",
    unitHint: "USD/bbl",
    avFunc: "BRENT",
    interval: "daily",
  },
  {
    id: "natgas",
    symbol: "NG",
    name: "Natural Gas",
    unitHint: "USD/MMBtu",
    avFunc: "NATURAL_GAS",
    interval: "daily",
  },
  // COPPER endpoint is monthly/quarterly/annual per Alpha Vantage docs → use monthly
  {
    id: "copper",
    symbol: "COPPER",
    name: "Copper",
    unitHint: "USD/mt",
    avFunc: "COPPER",
    interval: "monthly",
  },
  {
    id: "wheat",
    symbol: "WHEAT",
    name: "Wheat",
    unitHint: "USD/bu",
    avFunc: "WHEAT",
    interval: "daily",
  },
  // If you want spot gold, AV has a "GOLD" commodity series; if unavailable on your key/region,
  // you can alternatively use XAU via CURRENCY_EXCHANGE_RATE for the latest only.
  {
    id: "gold",
    symbol: "GOLD",
    name: "Gold (LBMA)",
    unitHint: "USD/oz",
    avFunc: "GOLD",
    interval: "daily",
  },
  // Iron ore is not provided as a commodity function on AV free tier → omit or leave as placeholder.
];

// AU proxies (quoted in AUD). We’ll try GLOBAL_QUOTE + TIME_SERIES_DAILY.
const AU_SYMBOLS = [
  { id: "bhp", symbol: "BHP.AX", name: "BHP Group" },
  { id: "rio", symbol: "RIO.AX", name: "Rio Tinto" },
  { id: "fmg", symbol: "FMG.AX", name: "Fortescue" },
  { id: "wds", symbol: "WDS.AX", name: "Woodside Energy" },
  { id: "sto", symbol: "STO.AX", name: "Santos" },
  { id: "fuel", symbol: "FUEL.AX", name: "Global Energy ETF (Hedged)" },
];

type AVCommodityResp = {
  data?: { date: string; value: string | number }[];
};

type AVFxResp = {
  "Realtime Currency Exchange Rate"?: {
    "5. Exchange Rate"?: string;
  };
};

function usdToAud(usd: number | null, audusd: number | null) {
  return usd != null && audusd && audusd > 0 ? usd / audusd : null;
}

async function avJson<T>(params: Record<string, string>) {
  const url = `${AV_BASE}?${new URLSearchParams({
    ...params,
    apikey: AV_KEY,
  })}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Alpha Vantage HTTP ${r.status}`);
  return (await r.json()) as T;
}

async function getAudUsd(): Promise<number | null> {
  try {
    const fx = await avJson<AVFxResp>({
      function: "CURRENCY_EXCHANGE_RATE",
      from_currency: "AUD",
      to_currency: "USD",
    });
    const v = fx?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
    return v ? Number(v) : null; // USD per 1 AUD
  } catch {
    return null;
  }
}

// Normalize a commodity series -> latest/prev/series
function normalizeCommoditySeries(
  data: { date: string; value: string | number }[]
) {
  const sorted = [...data].sort(
    (a, b) => +new Date(a.date) - +new Date(b.date)
  );
  const series = sorted
    .map((d) => Number(d.value))
    .filter((n) => Number.isFinite(n));
  const last = series.at(-1) ?? null;
  const prev = series.length >= 2 ? series.at(-2)! : null;
  const change = last != null && prev != null ? last - prev : null;
  const changePct = last != null && prev ? ((last - prev) / prev) * 100 : null;
  return { last, prev, change, changePct, series };
}

// Fetch one commodity
async function fetchCommodity(c: Item, audusd: number | null) {
  try {
    const json = await avJson<AVCommodityResp>({
      function: c.avFunc!,
      interval: c.interval || "daily",
    });
    const rows = json?.data ?? [];
    const { last, prev, change, changePct, series } =
      normalizeCommoditySeries(rows);
    // convert to AUD if USD-based
    const price = usdToAud(last, audusd);
    const prevAud = usdToAud(prev, audusd);
    const changeAud = usdToAud(change, audusd);
    return {
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      unit: (c.unitHint || "AUD").replace("USD/", "AUD/"),
      price,
      prev: prevAud,
      change: changeAud,
      changePct,
      series: series
        .map((v) => usdToAud(v, audusd) ?? v)
        .filter((v): v is number => Number.isFinite(v)),
    };
  } catch (e: any) {
    // graceful fallback
    return {
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      unit: (c.unitHint || "AUD").replace("USD/", "AUD/"),
      price: null,
      prev: null,
      change: null,
      changePct: null,
      series: [],
      _error: e?.message,
    } as any;
  }
}

// AU quotes: GLOBAL_QUOTE + TIME_SERIES_DAILY (sparkline)
async function fetchAuProxy(sym: { id: string; symbol: string; name: string }) {
  try {
    const [quote, series] = await Promise.all([
      avJson<any>({ function: "GLOBAL_QUOTE", symbol: sym.symbol }),
      avJson<any>({
        function: "TIME_SERIES_DAILY",
        symbol: sym.symbol,
        outputsize: "compact",
      }),
    ]);

    const q = quote?.["Global Quote"] || {};
    const price = q["05. price"] ? Number(q["05. price"]) : null;
    const prev = q["08. previous close"]
      ? Number(q["08. previous close"])
      : null;
    const change = q["09. change"]
      ? Number(q["09. change"])
      : price != null && prev != null
      ? price - prev
      : null;
    const changePct = q["10. change percent"]
      ? Number(String(q["10. change percent"]).replace("%", ""))
      : price != null && prev
      ? ((price - prev) / prev) * 100
      : null;

    const seriesMap = series?.["Time Series (Daily)"] || {};
    const sArr = Object.entries(seriesMap)
      .map(([date, o]: any) => ({ date, close: Number(o["4. close"]) }))
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .slice(-30) // small sparkline
      .map((x) => x.close)
      .filter((n) => Number.isFinite(n));

    return {
      id: sym.id,
      symbol: sym.symbol,
      name: sym.name,
      unit: "AUD",
      price,
      prev,
      change,
      changePct,
      series: sArr,
    };
  } catch (e: any) {
    return {
      id: sym.id,
      symbol: sym.symbol,
      name: sym.name,
      unit: "AUD",
      price: null,
      prev: null,
      change: null,
      changePct: null,
      series: [],
      _error: e?.message,
    } as any;
  }
}

export async function GET() {
  try {
    if (!AV_KEY) {
      return NextResponse.json(
        { error: "Missing ALPHA_VANTAGE_KEY" },
        { status: 500 }
      );
    }

    // FX AUDUSD (USD per 1 AUD)
    const audusd = await getAudUsd();

    // Commodities (USD → AUD)
    const items = await Promise.all(
      COMMODITY_SYMBOLS.map((c) => fetchCommodity(c, audusd))
    );

    // AU proxies (AUD)
    const auItems = await Promise.all(AU_SYMBOLS.map((s) => fetchAuProxy(s)));

    return NextResponse.json(
      {
        asof: Date.now(),
        base: "AUD",
        fx: { audusd },
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
