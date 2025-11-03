// app/api/models/jobs/backtest/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: enqueue to SQS research-jobs here
  const jobId = `r_${crypto.randomUUID()}`;
  return Response.json({ jobId, accepted: true, kind: "backtest", body });
}
