// app/api/models/strategies/route.ts
import { NextRequest } from "next/server";
import { putText, BUCKET } from "@/lib/s3";

function hasAwsEnv() {
  return !!(
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const code = typeof body?.code === "string" ? body.code : "";

    if (!name || !code) {
      return Response.json(
        { error: "Missing 'name' or 'code'" },
        { status: 400 }
      );
    }

    const base = `strategies/${encodeURIComponent(name)}`;

    // Dev-safe path: allow saving without S3 if not configured
    if (!hasAwsEnv()) {
      return Response.json(
        {
          ok: true,
          saved: "dev-noop",
          key: `${base}/main.py`,
          bucket: BUCKET ?? null,
        },
        { status: 201 }
      );
    }

    // Real S3 writes
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

    return Response.json(
      { ok: true, key: `${base}/main.py`, bucket: BUCKET },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/models/strategies failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "InternalError", message }, { status: 500 });
  }
}
