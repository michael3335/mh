// app/api/models/bots/route.ts
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireAnyRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { s3, BUCKET } from "@/lib/s3";

type PromotionSnapshot = {
  id: string;
  status: string;
  target: string;
  runId?: string | null;
  createdAt: string;
};

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
  state?: Record<string, unknown> | null;
  logTail?: string | null;
  lastPromotion?: PromotionSnapshot | null;
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

    const botIds = bots.map((b) => b.id);
    const promotions = botIds.length
      ? await prisma.promotion.findMany({
          where: { botId: { in: botIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const promotionLookup = new Map<string, PromotionSnapshot>();
    for (const promo of promotions) {
      if (!promotionLookup.has(promo.botId)) {
        promotionLookup.set(promo.botId, {
          id: promo.id,
          status: promo.status,
          target: promo.target,
          runId: promo.runId,
          createdAt: promo.createdAt.toISOString(),
        });
      }
    }

    const enriched: BotRow[] = await Promise.all(
      bots.map(async (bot) => {
        const [state, logTail] = await Promise.all([
          readBotState(bot.id),
          readBotLogTail(bot.id),
        ]);

        return {
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
          state,
          logTail,
          lastPromotion: promotionLookup.get(bot.id) ?? null,
        };
      })
    );

    return Response.json({ bots: enriched });
  } catch (error) {
    console.error("GET /api/models/bots failed:", error);
    return Response.json(
      { error: "ListBotsFailed" },
      { status: 500 }
    );
  }
}

async function readBotState(
  botId: string
): Promise<Record<string, unknown> | null> {
  const text = await getObjectText(`bots/${botId}/state.json`);
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function readBotLogTail(botId: string): Promise<string | null> {
  const text = await getObjectText(`bots/${botId}/logs/latest.txt`);
  if (!text) return null;
  return text.slice(-4000);
}

async function getObjectText(key: string): Promise<string | null> {
  if (!BUCKET) return null;
  try {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    const body = await res.Body?.transformToString?.("utf-8");
    return body ?? null;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    console.warn(`[bots] failed to read ${key}`, error);
    return null;
  }
}

function isNotFound(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const meta =
    (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
  if (meta === 404) return true;
  const code = (error as { Code?: string }).Code;
  return code === "NoSuchKey";
}
