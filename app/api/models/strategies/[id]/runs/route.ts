// app/api/models/strategies/[id]/runs/route.ts
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = decodeURIComponent(params.id);
  // TODO: replace with DB query filtered by strategyId/name
  const runs = [
    {
      id: "r_seed_001",
      status: "SUCCEEDED",
      startedAt: "2025-01-09T10:00:00Z",
      kpis: { cagr: 0.37, mdd: -0.21, sharpe: 1.2, trades: 322 },
    },
  ];
  return Response.json({ strategy: id, runs });
}
