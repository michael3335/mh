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

const GridArray = z
  .array(z.record(z.string(), z.unknown()))
  .min(1, "grid must contain at least one item");

const GridBody = z.object({
  strategy: z.string().min(1),
  strategySlug: z.string().min(1).optional(),
  dataset: DatasetInputSchema,
  grid: GridArray,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authz = await requireRole(session, "researcher");
  if (!authz.ok) return authz.response;
  try {
    const parsed = GridBody.safeParse(await req.json().catch(() => ({})));
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
      kind: "GRID",
      spec,
    });

    const job = ResearchJob.parse({
      runId,
      strategyId: strategy.id,
      manifestS3Key: strategy.latestVersion.s3Key,
      artifactPrefix,
      kind: "grid",
      grid: parsed.data.grid,
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

    const messageId = await sendJson(queueUrl, job);
    return Response.json({
      jobId: runId,
      accepted: true,
      kind: "grid",
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
      { error: "GridEnqueueFailed", message: msg },
      { status: 400 }
    );
  }
}
