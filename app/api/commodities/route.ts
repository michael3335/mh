// app/api/commodities/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

/**
 * Yahoo JSON endpoints (undocumented).
 * - Quotes: {host}/v7/finance/quote?symbols=...
 * - Chart:  {host}/v8/finance/chart/:symbol?range=5d&interval=1h
 */

type SymbolMap = {
  id: string;
  symbol: string;
  name: string;
  unitHint?: string;
};

/** Core USD commodities (we'll convert to AUD for UI) */
const COMMODITY_SYMBOLS: SymbolMap[] = [
  { id: "gold", symbol: "GC=F", name: "Gold (Fut)", unitHint: "USD/oz" },
  { id: "xau", symbol: "XAUUSD=X", name: "Gold Spot", unitHint: "USD/oz" },
  { id: "wti", symbol: "CL=F", name: "WTI Crude", unitHint: "USD/bbl" },
  { id: "brent", symbol: "BZ=F", name: "Brent Crude", unitHint: "USD/bbl" },
  { id: "copper", symbol: "HG=F", name: "Copper", unitHint: "USD/lb" },
  { id: "natgas", symbol: "NG=F", name: "Natural Gas", unitHint: "USD/MMBtu" },
  { id: "wheat", symbol: "ZW=F", name: "Wheat", unitHint: "USD/bu" }, // correct
  { id: "iron", symbol: "TIO=F", name: "Iron Ore (62%)", unitHint: "USD/t" },
];

/** AU-centric proxies (mostly quoted in AUD on Yahoo via .AX) */
const AU_SYMBOLS: SymbolMap[] = [
  { id: "bhp", symbol: "BHP.AX", name: "BHP Group" },
  { id: "rio", symbol: "RIO.AX", name: "Rio Tinto" },
  { id: "fmg", symbol: "FMG.AX", name: "Fortescue" },
  { id: "wds", symbol: "WDS.AX", name: "Woodside Energy" },
  { id: "sto", symbol: "STO.AX", name: "Santos" },
  { id: "fuel", symbol: "FUEL.AX", name: "Global Energy ETF (Hedged)" },
  // add SGX iron ore / JKM once you pick exact Yahoo symbols
];

const FX_SYMBOL = "AUDUSD=X"; // USD per 1 AUD

/* ---------- Robust Yahoo fetch helpers ---------- */

const HOSTS = [
  process.env.Y_QUERY_HOST || "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com",
];

const REQ_HEADERS: HeadersInit = {
  // Browser-y headers reduce 401/403 risk on serverless providers
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  Accept: "application/json,text/*;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-AU,en;q=0.9",
  Referer: "https://finance.yahoo.com/",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

function quoteURL(host: string, symbols: string[]) {
  return `${host}/v7/finance/quote?symbols=${encodeURIComponent(
    symbols.join(",")
  )}`;
}
function chartURL(host: string, symbol: string) {
  return `${host}/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=5d&interval=1h`;
}

async function fetchJSON<T>(url: string, abortMs = 12_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), abortMs);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: REQ_HEADERS,
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Fetch failed: ${res.status} ${res.statusText}${
          text ? ` — ${text.slice(0, 140)}` : ""
        }`
      );
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// Retry across hosts; small backoff; treat 401/403 specially
async function fetchWithFallback<T>(
  makeUrl: (host: string) => string,
  attempts = 4,
  baseDelay = 250
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    for (const host of HOSTS) {
      try {
        const url = makeUrl(host);
        return await fetchJSON<T>(url);
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || "");
        // If it looks like a hard block, try next host immediately
        if (msg.includes("401") || msg.includes("403")) {
          continue;
        }
      }
    }
    await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, i))); // backoff
  }
  throw lastErr instanceof Error ? lastErr : new Error("Fetch failed");
}

// Yahoo sometimes 401s many-symbol queries; batch them.
function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// USD -> AUD using AUDUSD (USD per 1 AUD). AUD = USD / AUDUSD
const usdToAud = (usd: number | null, audusd: number | null) =>
  usd != null && audusd && audusd > 0 ? usd / audusd : null;

// Convert only when needed: if Yahoo says currency USD or unitHint starts with USD/
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

/* ---------- Handler ---------- */

export async function GET() {
  try {
    const groups = [
      { key: "commodities", list: COMMODITY_SYMBOLS },
      { key: "auWatch", list: AU_SYMBOLS },
    ];

    const symbols = groups.flatMap((g) => g.list.map((s) => s.symbol));
    const allQuoteSymbols = [...symbols, FX_SYMBOL];

    // 1) QUOTES (batched + fallback)
    const batches = chunk(allQuoteSymbols, 8); // keep small to avoid 401
    const batchResults = await Promise.all(
      batches.map((batch) =>
        fetchWithFallback<any>((host) => quoteURL(host, batch))
      )
    );
    const quoteBySymbol: Record<string, any> = {};
    for (const b of batchResults) {
      for (const q of b?.quoteResponse?.result ?? []) {
        quoteBySymbol[q.symbol] = q;
      }
    }

    const audusd =
      quoteBySymbol[FX_SYMBOL]?.regularMarketPrice ??
      quoteBySymbol[FX_SYMBOL]?.postMarketPrice ??
      quoteBySymbol[FX_SYMBOL]?.preMarketPrice ??
      null;

    // 2) CHARTS (parallel + fallback; convert series only if USD)
    const chartResults = await Promise.allSettled(
      symbols.map(async (sym) => {
        const data = await fetchWithFallback<any>((host) =>
          chartURL(host, sym)
        );
        const closeSeries: number[] =
          data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
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

    // 3) NORMALISE (AUD base; only convert USD quotes)
    const payload: Record<string, any[]> = {};
    for (const g of groups) {
      payload[g.key] = g.list.map((meta) => {
        const q = quoteBySymbol[meta.symbol] ?? {};
        const currency: string | undefined = q.currency;

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
        items: payload.commodities, // backward-compat for your UI
        auItems: payload.auWatch, // AU proxies
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
