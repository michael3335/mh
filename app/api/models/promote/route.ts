import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { PromoteJob } from "@/lib/contracts";
import { sendJson } from "@/lib/sqs";

const BodySchema = z.object({
  runId: z.string().min(1),
  botId: z.string().min(1),
  target: z.enum(["paper", "live"]).default("paper"),
});

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authz = await requireRole(session, "researcher");
  if (!authz.ok) return authz.response;

  if (!hasDatabase()) {
    return Response.json(
      { error: "DATABASE_URL not configured" },
      { status: 500 }
    );
  }

  const body = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return Response.json({ error: "InvalidPayload", issues: body.error.issues }, { status: 400 });
  }

  const { runId, botId, target } = body.data;
  const queueUrl = process.env.SQS_PROMOTION_JOBS_URL;
  if (!queueUrl) {
    return Response.json(
      { error: "Missing SQS_PROMOTION_JOBS_URL" },
      { status: 500 }
    );
  }

  try {
    let promotionId: string | null = null;
    let artifactPrefix: string | null = null;
    let strategyId: string | null = null;
    let ownerId: string | null = null;

    ownerId = getSessionUserId(session);
    if (!ownerId) {
      return Response.json(
        { error: "Missing user identifier" },
        { status: 400 }
      );
    }

    const run = await prisma.run.findUnique({
      where: { id: runId },
    });
    if (!run || (run.ownerId && run.ownerId !== ownerId)) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }
    artifactPrefix = run.artifactPrefix;
    strategyId = run.strategyId;

    const bot = await prisma.bot.findUnique({ where: { id: botId } });
    if (!bot || (bot.ownerId && bot.ownerId !== ownerId)) {
      return Response.json({ error: "Bot not found" }, { status: 404 });
    }

    const promotion = await prisma.promotion.create({
      data: {
        runId,
        botId,
        target: target.toUpperCase(),
      },
    });
    promotionId = promotion.id;

    const sqsPayload = {
      promotionId,
      ...PromoteJob.parse({
        botId,
        runId,
        strategyId: strategyId ?? runId,
        artifactPrefix: artifactPrefix ?? `runs/${runId}/`,
        target,
      }),
    };

    const messageId = await sendJson(queueUrl, sqsPayload);

    if (promotionId && hasDatabase()) {
      await prisma.promotion.update({
        where: { id: promotionId },
        data: { status: "SENT" },
      });
    }

    return Response.json(
      { ok: true, promotionId, messageId },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST /api/models/promote failed:", error);
    return Response.json(
      { error: "PromotionFailed", message: String(error) },
      { status: 500 }
    );
  }
}
