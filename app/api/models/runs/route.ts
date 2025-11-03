// app/api/models/runs/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 🔹 No placeholder data — integrate DB or S3 fetch logic here later.
    const runs: unknown[] = [];

    return NextResponse.json({ runs }, { status: 200 });
  } catch (err) {
    console.error("Failed to load runs:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "FailedToFetchRuns", message },
      { status: 500 }
    );
  }
}
