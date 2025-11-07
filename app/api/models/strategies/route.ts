// app/api/models/strategies/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { putText, BUCKET } from "@/lib/s3";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authz = requireRole(session, "researcher");
  if (!authz.ok) return authz.response;
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
