// app/api/models/bots/route.ts
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireAnyRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type BotRow = {
  id: string;
  name: string;
  mode: string;
  status: string;
  equity?: number | null;
  dayPnl?: number | null;
  pairlist: string[];
  strategy?: { name: string; slug: string } | null;
  updatedAt: string;
};

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

export async function GET() {
  const session = await getServerSession(authOptions);
  const authz = await requireAnyRole(session, ["botOperator", "researcher"]);
  if (!authz.ok) return authz.response;

  if (!hasDatabase()) {
    return Response.json(
      { error: "DATABASE_URL not configured" },
      { status: 500 }
    );
  }

  try {
    const ownerId = getSessionUserId(session);
    const bots = await prisma.bot.findMany({
      where: ownerId ? { ownerId } : undefined,
      include: {
        strategy: { select: { name: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return Response.json({
      bots: bots.map<BotRow>((bot) => ({
        id: bot.id,
        name: bot.name,
        mode: bot.mode,
        status: bot.status,
        equity: bot.equity ?? null,
        dayPnl: bot.dayPnl ?? null,
        pairlist: bot.pairlist,
        strategy: bot.strategy
          ? { name: bot.strategy.name, slug: bot.strategy.slug }
          : null,
        updatedAt: bot.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/models/bots failed:", error);
    return Response.json(
      { error: "ListBotsFailed" },
      { status: 500 }
    );
  }
}
