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

const Walkforward = z.object({
  trainMonths: z.number().int().positive(),
  testMonths: z.number().int().positive(),
  stepMonths: z.number().int().positive(),
});

const WalkforwardBody = z.object({
  strategy: z.string().min(1),
  strategySlug: z.string().min(1).optional(),
  dataset: DatasetInputSchema,
  walkforward: Walkforward,
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
    const parsed = WalkforwardBody.safeParse(
      await req.json().catch(() => ({}))
    );
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
    const wf = parsed.data.walkforward;

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
      kind: "WALKFORWARD",
      spec,
    });

    const payload = ResearchJob.parse({
      runId,
      strategyId: strategy.id,
      manifestS3Key: strategy.latestVersion.s3Key,
      artifactPrefix,
      kind: "walkforward",
      spec,
      ownerId,
    });

    const queueUrl = process.env.SQS_RESEARCH_JOBS_URL;
    if (!queueUrl) {
      return Response.json(
        { error: "Missing SQS_RESEARCH_JOBS_URL" },
        { status: 500 }
      );
    }

    // Add WF alongside the validated job for the worker (ResearchJob allows extra keys in your worker)
    const messageId = await sendJson(queueUrl, { ...payload, walkforward: wf });
    return Response.json({
      jobId: runId,
      artifactPrefix,
      accepted: true,
      kind: "walkforward",
      messageId,
    });
  } catch (error) {
    const msg =
      error && typeof error === "object" && "issues" in error
        ? JSON.stringify((error as { issues: unknown }).issues, null, 2)
        : error instanceof Error
        ? error.message
        : String(error);
    return Response.json(
      { error: "WalkforwardEnqueueFailed", message: msg },
      { status: 400 }
    );
  }
}
