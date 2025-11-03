// app/api/models/jobs/grid/route.ts
import { NextRequest } from "next/server";
export async function POST(req: NextRequest) {
  const body = await req.json();
  const jobId = `r_${crypto.randomUUID()}`;
  return Response.json({ jobId, accepted: true, kind: "grid", body });
}
