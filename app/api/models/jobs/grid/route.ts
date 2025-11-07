import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { ResearchJob } from "@/lib/contracts";
import { sendJson } from "@/lib/sqs";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";

const GridArray = z
  .array(z.record(z.string(), z.unknown()))
  .min(1, "grid must contain at least one item");

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authz = requireRole(session, "researcher");
  if (!authz.ok) return authz.response;
  try {
    const body = await req.json();
    const grid = GridArray.parse(body.grid);

    const runId = `r_${crypto.randomUUID()}`;
    const job = ResearchJob.parse({
      runId,
      strategyId: body.strategy,
      manifestS3Key: `strategies/${encodeURIComponent(body.strategy)}/main.py`,
      artifactPrefix: `runs/${runId}/`,
      kind: "grid",
      grid,
      spec: {
        exchange: body?.dataset?.exchange,
        pair: String(body?.dataset?.pairs ?? "")
          .split(",")[0]
          ?.trim(),
        timeframe: body?.dataset?.timeframe,
        start: body?.dataset?.from,
        end: body?.dataset?.to,
      },
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
