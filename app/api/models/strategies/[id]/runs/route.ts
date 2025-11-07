import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const authz = requireRole(session, "researcher");
  if (!authz.ok) return authz.response;

  const { id } = await ctx.params;
  const strategy = decodeURIComponent(id);
  // TODO: replace with DB results
  const runs = [
    {
      id: "r_seed_001",
      status: "SUCCEEDED",
      startedAt: "2025-01-09T10:00:00Z",
      kpis: { cagr: 0.37, mdd: -0.21, sharpe: 1.2, trades: 322 },
    },
  ];
  return Response.json({ strategy, runs });
}
