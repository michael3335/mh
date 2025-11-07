import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { ResearchJob } from "@/lib/contracts";
import { sendJson } from "@/lib/sqs";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { getSessionUserId } from "@/lib/session";
import {
  DatasetInputSchema,
  normalizeDataset,
  recordQueuedRun,
  resolveStrategyForOwner,
} from "@/app/api/models/jobs/helpers";

const BacktestBody = z.object({
  strategy: z.string().min(1),
  strategySlug: z.string().min(1).optional(),
  params: z.record(z.string(), z.unknown()).default({}),
  dataset: DatasetInputSchema,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authz = await requireRole(session, "researcher");
  if (!authz.ok) return authz.response;
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "DATABASE_URL not configured" },
      { status: 500 }
    );
  }
  try {
    const parsed = BacktestBody.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return Response.json(
        { error: "InvalidPayload", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const ownerId = getSessionUserId(session);
    if (!ownerId) {
      return Response.json(
        { error: "SessionMissingIdentifier" },
        { status: 400 }
      );
    }

    const runId = `r_${crypto.randomUUID()}`;
    const artifactPrefix = `runs/${runId}/`;
    const identifier = parsed.data.strategySlug ?? parsed.data.strategy;
    const strategy = await resolveStrategyForOwner(identifier, ownerId);
    if (!strategy) {
      return Response.json({ error: "StrategyNotFound" }, { status: 404 });
    }
    if (!strategy.latestVersion?.s3Key) {
      return Response.json(
        { error: "StrategyMissingSource" },
        { status: 400 }
      );
    }

    const spec = normalizeDataset(parsed.data.dataset);

    await recordQueuedRun({
      runId,
      strategyId: strategy.id,
      ownerId,
      artifactPrefix,
      kind: "BACKTEST",
      spec,
      params: parsed.data.params,
    });

    const job = ResearchJob.parse({
      runId,
      strategyId: strategy.id,
      manifestS3Key: strategy.latestVersion.s3Key,
      artifactPrefix,
      kind: "backtest",
      spec,
      params: parsed.data.params ?? {},
      ownerId,
    });

    const queueUrl = process.env.SQS_RESEARCH_JOBS_URL;
    if (!queueUrl) {
      return new Response(
        JSON.stringify({ ok: false, error: "SQS_RESEARCH_JOBS_URL missing" }),
        { status: 500 }
      );
    }

    const messageId = await sendJson(queueUrl, job);
    return Response.json({
      jobId: runId,
      accepted: true,
      kind: "backtest",
      messageId,
    });
  } catch (error) {
    const responseBody =
      error && typeof error === "object" && "issues" in error
        ? { zodIssues: (error as { issues: unknown }).issues }
        : error instanceof Error
        ? { message: error.message }
        : { error: "Unknown error" };
    return new Response(JSON.stringify({ ok: false, ...responseBody }), {
      status: 400,
    });
  }
}
