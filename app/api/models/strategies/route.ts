// app/api/models/strategies/route.ts
import { NextRequest } from "next/server";
import { putText, BUCKET } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const { name, code } = (await req.json()) as { name?: string; code?: string };
  if (!name || !code) return new Response("Missing name/code", { status: 400 });

  // Simple structure: strategies/<name>/main.py + manifest.json
  const base = `strategies/${encodeURIComponent(name)}`;
  await putText(`${base}/main.py`, code, "text/x-python");
  await putText(
    `${base}/manifest.json`,
    JSON.stringify(
      {
        name,
        version: "dev",
        params: [
          { key: "rsi_len", label: "RSI Length", type: "int", default: 14 },
          { key: "rsi_buy", label: "RSI Buy", type: "int", default: 30 },
          { key: "rsi_sell", label: "RSI Sell", type: "int", default: 70 },
        ],
        entrypoint: "main.py",
      },
      null,
      2
    ),
    "application/json"
  );

  return Response.json({ ok: true, key: `${base}/main.py`, bucket: BUCKET });
}
