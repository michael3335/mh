// app/api/commodities/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

/**
 * Yahoo Finance JSON endpoints (undocumented).
 * - Quotes: https://query1.finance.yahoo.com/v7/finance/quote?symbols=...
 * - Chart:  https://query1.finance.yahoo.com/v8/finance/chart/:symbol?range=5d&interval=1h
 */

type SymbolMap = {
  id: string;
  symbol: string;
  name: string;
  unitHint?: string; // display hint if Yahoo omits currency
};

/** Core USD commodities (we'll convert to AUD for UI) */
const COMMODITY_SYMBOLS: SymbolMap[] = [
  { id: "gold", symbol: "GC=F", name: "Gold (Fut)", unitHint: "USD/oz" },
  { id: "xau", symbol: "XAUUSD=X", name: "Gold Spot", unitHint: "USD/oz" },
  { id: "wti", symbol: "CL=F", name: "WTI Crude", unitHint: "USD/bbl" },
  { id: "brent", symbol: "BZ=F", name: "Brent Crude", unitHint: "USD/bbl" },
  { id: "copper", symbol: "HG=F", name: "Copper", unitHint: "USD/lb" },
  { id: "natgas", symbol: "NG=F", name: "Natural Gas", unitHint: "USD/MMBtu" },
  { id: "wheat", symbol: "ZW=F", name: "Wheat", unitHint: "USD/bu" }, // ✅ USD/bu (not ¢/bu)
  { id: "iron", symbol: "TIO=F", name: "Iron Ore (62%)", unitHint: "USD/t" },
];

/** AU-centric proxies (quoted in AUD on Yahoo via .AX) */
const AU_SYMBOLS: SymbolMap[] = [
  // Iron ore proxies
  { id: "bhp", symbol: "BHP.AX", name: "BHP Group" },
  { id: "rio", symbol: "RIO.AX", name: "Rio Tinto" },
  { id: "fmg", symbol: "FMG.AX", name: "Fortescue" },

  // Energy proxies (oil/LNG)
  { id: "wds", symbol: "WDS.AX", name: "Woodside Energy" },
  { id: "sto", symbol: "STO.AX", name: "Santos" },
  { id: "fuel", symbol: "FUEL.AX", name: "Global Energy ETF (Hedged)" },

  // You can add SGX iron ore & JKM here when you pick exact tickers on Yahoo:
  // e.g. { id: "sgx_fe62", symbol: "XXXX.SI", name: "SGX Iron Ore 62%" }
  // e.g. { id: "jkm",      symbol: "XXXX",    name: "LNG JKM Index" }
];

const FX_SYMBOL = "AUDUSD=X"; // USD per 1 AUD

const host = process.env.Y_QUERY_HOST ?? "https://query1.finance.yahoo.com";
const QUOTE_URL = (symbols: string[]) =>
  `${host}/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;

const CHART_URL = (symbol: string) =>
  `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1h`;

const REQ_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  Accept: "application/json,text/*;q=0.9,*/*;q=0.8",
};

async function fetchJSON<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: REQ_HEADERS,
      signal: controller.signal,
    });
    if (!res.ok)
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

// Convert USD amount -> AUD using AUDUSD (USD per 1 AUD).
// AUD = USD / AUDUSD
const usdToAud = (usd: number | null, audusd: number | null) =>
  usd != null && audusd && audusd > 0 ? usd / audusd : null;

// Decide whether to convert:
// - Convert if Yahoo says currency === "USD" OR unit hint starts with USD/
// - For equities on ASX (currency "AUD"), don't convert.
function maybeConvertToAud(
  value: number | null,
  qCurrency: string | null | undefined,
  unitHint?: string,
  audusd?: number | null
) {
  const shouldConvert =
    qCurrency?.toUpperCase?.() === "USD" ||
    (unitHint?.startsWith("USD/") ?? false);
  return shouldConvert ? usdToAud(value, audusd ?? null) : value;
}

export async function GET() {
  try {
    const allSymbolGroups = [
      { key: "commodities", list: COMMODITY_SYMBOLS },
      { key: "auWatch", list: AU_SYMBOLS },
    ];

    const symbols = allSymbolGroups.flatMap((g) => g.list.map((s) => s.symbol));
    const allQuoteSymbols = [...symbols, FX_SYMBOL];

    // 1) Quotes
    const quoteJson = await fetchJSON<any>(QUOTE_URL(allQuoteSymbols));
    const quoteBySymbol: Record<string, any> = {};
    for (const q of quoteJson?.quoteResponse?.result ?? []) {
      quoteBySymbol[q.symbol] = q;
    }

    const audusd =
      quoteBySymbol[FX_SYMBOL]?.regularMarketPrice ??
      quoteBySymbol[FX_SYMBOL]?.postMarketPrice ??
      quoteBySymbol[FX_SYMBOL]?.preMarketPrice ??
      null;

    // 2) Charts (parallel; we’ll convert series only if its currency is USD)
    const chartResults = await Promise.allSettled(
      symbols.map(async (sym) => {
        const chart = await fetchJSON<any>(CHART_URL(sym));
        const closeSeries: number[] =
          chart?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
            (n: number | null) => typeof n === "number"
          ) ?? [];
        const q = quoteBySymbol[sym];
        const currency: string | undefined = q?.currency;

        const series =
          currency?.toUpperCase?.() === "USD"
            ? audusd
              ? closeSeries.map((n) => usdToAud(n, audusd)!)
              : closeSeries
            : closeSeries;

        return { symbol: sym, series };
      })
    );

    const seriesBySymbol: Record<string, number[]> = {};
    for (const r of chartResults) {
      if (r.status === "fulfilled")
        seriesBySymbol[r.value.symbol] = r.value.series;
    }

    // 3) Build groups
    const groupPayload: Record<string, any[]> = {};

    for (const group of allSymbolGroups) {
      groupPayload[group.key] = group.list.map((meta) => {
        const q = quoteBySymbol[meta.symbol] ?? {};
        const currency: string | undefined = q.currency;

        // Prefer regular → post → pre
        const priceRaw =
          q.regularMarketPrice ?? q.postMarketPrice ?? q.preMarketPrice ?? null;
        const prevRaw = q.regularMarketPreviousClose ?? null;
        const changeRaw =
          q.regularMarketChange ??
          (priceRaw != null && prevRaw != null ? priceRaw - prevRaw : null);
        const changePct =
          q.regularMarketChangePercent ??
          (priceRaw != null && prevRaw != null
            ? ((priceRaw - prevRaw) / prevRaw) * 100
            : null);

        // Only convert when appropriate
        const price = maybeConvertToAud(
          priceRaw,
          currency,
          meta.unitHint,
          audusd
        );
        const prev = maybeConvertToAud(
          prevRaw,
          currency,
          meta.unitHint,
          audusd
        );
        const change = maybeConvertToAud(
          changeRaw,
          currency,
          meta.unitHint,
          audusd
        );

        const name = meta.name ?? q.shortName ?? q.longName ?? meta.symbol;

        // Flip USD/* -> AUD/* for commodities we convert; otherwise keep unit
        const unit =
          currency?.toUpperCase?.() === "USD" ||
          meta.unitHint?.startsWith("USD/")
            ? meta.unitHint?.replace("USD/", "AUD/") ?? "AUD"
            : meta.unitHint ?? currency ?? "AUD";

        return {
          id: meta.id,
          symbol: meta.symbol,
          name,
          unit,
          price,
          prev,
          change,
          changePct,
          series: seriesBySymbol[meta.symbol] ?? [],
        };
      });
    }

    return NextResponse.json(
      {
        asof: Date.now(),
        base: "AUD",
        fx: { audusd },
        items: groupPayload.commodities, // backward-compatible
        auItems: groupPayload.auWatch, // NEW
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
