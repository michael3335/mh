/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/commodities/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * GET /api/commodities/:id
 * Returns full USD history for a single series (commodity or AU proxy), plus FX (USD per 1 AUD).
 * Client converts to AUD if desired.
 */

export const runtime = "nodejs";
export const revalidate = 0;

/* -------------------- Config (keep in sync with /api/commodities) -------------------- */

const S3_REGION = process.env.AWS_S3_REGION || "ap-southeast-2";
const S3_BUCKET = process.env.AWS_S3_BUCKET || "";
const S3_PREFIX = (process.env.AWS_S3_PREFIX || "commodities").replace(
  /\/+$/,
  ""
);
const S3_KEY_USD = `${S3_PREFIX}/history_usd.json`;

const AV_KEY = process.env.ALPHA_VANTAGE_KEY || "";
const FRED_KEY = process.env.FRED_API_KEY || "";

const s3 = new S3Client({ region: S3_REGION });

type SeriesPoint = { date: string; value: number };
type History = { [id: string]: SeriesPoint[] };

type CSpec = {
  id: string;
  name: string;
  unitUSD: string;
};

const COMMODITIES: CSpec[] = [
  { id: "gold", name: "Gold (LBMA)", unitUSD: "USD/oz" },
  { id: "wti", name: "WTI Crude", unitUSD: "USD/bbl" },
  { id: "brent", name: "Brent Crude", unitUSD: "USD/bbl" },
  { id: "natgas", name: "Natural Gas", unitUSD: "USD/MMBtu" },
  { id: "copper", name: "Copper", unitUSD: "USD/mt" },
  { id: "wheat", name: "Wheat", unitUSD: "USD/bu" },
  { id: "iron", name: "Iron Ore (62%)", unitUSD: "USD/t" },
];

const AU_PROXIES = [
  { id: "bhp", symbol: "BHP", name: "BHP Group (NYSE)" },
  { id: "rio", symbol: "RIO", name: "Rio Tinto (NYSE)" },
  { id: "fmg", symbol: "FSUGY", name: "Fortescue (OTC ADR)" },
  { id: "wds", symbol: "WDS", name: "Woodside Energy (NYSE)" },
  { id: "sto", symbol: "STOSF", name: "Santos (OTC)" },
  { id: "fuel", symbol: "XLE", name: "Energy Select Sector SPDR" },
];

const isFiniteNum = (n: any): n is number => Number.isFinite(n);

async function getS3JSON<T>(Key: string, fallback: T): Promise<T> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key }));
    // @ts-expect-error Node >=18 has transformToString available
    const body = await res.Body?.transformToString?.("utf-8");
    return body ? (JSON.parse(body) as T) : fallback;
  } catch {
    return fallback;
  }
}

/* --- FX: realtime AV → FRED fallback (USD per 1 AUD) --- */

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

function findMeta(id: string) {
  const c = COMMODITIES.find((x) => x.id === id);
  if (c)
    return { kind: "commodity" as const, title: c.name, unitUSD: c.unitUSD };
  const p = AU_PROXIES.find((x) => x.id === id);
  if (p) return { kind: "proxy" as const, title: p.name, unitUSD: "USD" };
  return null;
}

/** Next.js 16: context.params is a Promise. */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!S3_BUCKET) {
      return NextResponse.json(
        { error: "Missing AWS_S3_BUCKET" },
        { status: 500 }
      );
    }

    const { id } = await context.params; // <- important change
    const seriesId = id?.toLowerCase();
    const meta = findMeta(seriesId);
    if (!meta) {
      return NextResponse.json(
        { error: `Unknown series id "${seriesId}"` },
        { status: 404 }
      );
    }

    const historyUSD: History = await getS3JSON<History>(S3_KEY_USD, {});
    const seriesUSD = (historyUSD[seriesId] ?? []).filter((p) =>
      isFiniteNum(p.value)
    );

    const audusd = await getAUDUSD(); // USD per 1 AUD (null if unavailable)

    return NextResponse.json({
      id: seriesId,
      title: meta.title,
      unitUSD: meta.unitUSD,
      fx: { audusd },
      seriesUSD, // full history in USD
      asof: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load series" },
      { status: 500 }
    );
  }
}
