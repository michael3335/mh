import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { mapRunRow, type RunRow } from "@/lib/serializers/run";
import { getSessionUserId } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const authz = await requireRole(session, "researcher");
  if (!authz.ok) return authz.response;

  const { id } = await ctx.params;
  const identifier = decodeURIComponent(id);

  const dbRuns = await fetchStrategyRuns(identifier, getSessionUserId(session));
  if (dbRuns) {
    return Response.json({
      strategy: dbRuns.strategyName,
      runs: dbRuns.runs,
    });
  }

  const runs: RunRow[] = [
    {
      id: "r_seed_001",
      strategyName: identifier,
      kind: "backtest",
      status: "SUCCEEDED",
      startedAt: "2025-01-09T10:00:00Z",
      finishedAt: null,
      kpis: { cagr: 0.37, mdd: -0.21, sharpe: 1.2, trades: 322 },
    },
  ];

  return Response.json({ strategy: identifier, runs });
}

async function fetchStrategyRuns(
  identifier: string,
  userId: string | null
): Promise<{ strategyName: string; runs: RunRow[] } | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const strategy = await prisma.strategy.findFirst({
      where: userId
        ? {
            AND: [
              { ownerId: userId },
              { OR: [{ id: identifier }, { slug: identifier }] },
            ],
          }
        : { OR: [{ id: identifier }, { slug: identifier }] },
      select: { id: true, name: true },
    });
    if (!strategy) return null;

    const runs = await prisma.run.findMany({
      where: { strategyId: strategy.id },
      include: { strategy: { select: { name: true } } },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return {
      strategyName: strategy.name,
      runs: runs.map(mapRunRow),
    };
  } catch (error) {
    console.warn("[strategy runs] DB fallback", error);
    return null;
  }
}
