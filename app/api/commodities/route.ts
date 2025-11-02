import { NextResponse } from "next/server";

/**
 * Live commodities via Yahoo Finance (no key).
 * Quotes endpoint:   https://query1.finance.yahoo.com/v7/finance/quote
 * Chart endpoint:    https://query1.finance.yahoo.com/v8/finance/chart/:symbol?range=5d&interval=1h
 */

type SymbolMap = {
  id: string;
  symbol: string;
  name: string;
  unitHint?: string; // optional display hint if Yahoo omits currency
};

const SYMBOLS: SymbolMap[] = [
  { id: "gold", symbol: "GC=F", name: "Gold (Fut)", unitHint: "USD/oz" },
  { id: "xau", symbol: "XAUUSD=X", name: "Gold Spot", unitHint: "USD/oz" },
  { id: "wti", symbol: "CL=F", name: "WTI Crude", unitHint: "USD/bbl" },
  { id: "brent", symbol: "BZ=F", name: "Brent Crude", unitHint: "USD/bbl" },
  { id: "copper", symbol: "HG=F", name: "Copper", unitHint: "USD/lb" },
  { id: "natgas", symbol: "NG=F", name: "Natural Gas", unitHint: "USD/MMBtu" },
  { id: "wheat", symbol: "ZW=F", name: "Wheat", unitHint: "¢/bu" },
  { id: "iron", symbol: "TIO=F", name: "Iron Ore (62%)", unitHint: "USD/t" },
];

const QUOTE_URL = (symbols: string[]) =>
  `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
    symbols.join(",")
  )}`;

const CHART_URL = (symbol: string) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=5d&interval=1h`;

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 30 } }); // cache ~30s
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function GET() {
  try {
    // 1) quotes
    const symbols = SYMBOLS.map((s) => s.symbol);
    const quoteJson = await fetchJSON<any>(QUOTE_URL(symbols));
    const quoteBySymbol: Record<string, any> = {};
    for (const q of quoteJson?.quoteResponse?.result ?? []) {
      quoteBySymbol[q.symbol] = q;
    }

    // 2) small 5d sparkline for each symbol (parallel but bounded)
    // (Yahoo chart sometimes returns sparse timestamps; we just pick close values)
    const chartResults = await Promise.allSettled(
      SYMBOLS.map(async (s) => {
        const chart = await fetchJSON<any>(CHART_URL(s.symbol));
        const series: number[] =
          chart?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
            (n: number | null) => typeof n === "number"
          ) ?? [];
        return { symbol: s.symbol, series };
      })
    );

    const seriesBySymbol: Record<string, number[]> = {};
    for (const r of chartResults) {
      if (r.status === "fulfilled") {
        seriesBySymbol[r.value.symbol] = r.value.series;
      }
    }

    // 3) Normalize payload
    const items = SYMBOLS.map((meta) => {
      const q = quoteBySymbol[meta.symbol] ?? {};
      const price =
        q.regularMarketPrice ?? q.postMarketPrice ?? q.preMarketPrice ?? null;
      const prev = q.regularMarketPreviousClose ?? null;
      const change =
        q.regularMarketChange ??
        (price != null && prev != null ? price - prev : null);
      const changePct =
        q.regularMarketChangePercent ??
        (price != null && prev != null ? ((price - prev) / prev) * 100 : null);
      const currency = q.currency ?? "USD";
      const name = meta.name ?? q.shortName ?? q.longName ?? meta.symbol;
      const unit = meta.unitHint ?? currency;

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

    return NextResponse.json({ asof: Date.now(), items }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load commodities" },
      { status: 500 }
    );
  }
}
