import { NextRequest } from "next/server";
import { z } from "zod";
import { ResearchJob } from "@/lib/contracts";
import { sendJson } from "@/lib/sqs";

const Walkforward = z.object({
  trainMonths: z.number().int().positive(),
  testMonths: z.number().int().positive(),
  stepMonths: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wf = Walkforward.parse(body.walkforward);

    const runId = `r_${crypto.randomUUID()}`;
    const payload = ResearchJob.parse({
      runId,
      strategyId: body.strategy,
      manifestS3Key: `strategies/${encodeURIComponent(body.strategy)}/main.py`,
      artifactPrefix: `runs/${runId}/`,
      kind: "walkforward",
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

    // Add WF alongside the validated job for the worker (ResearchJob allows extra keys in your worker)
    const messageId = await sendJson(queueUrl, { ...payload, walkforward: wf });
    return Response.json({
      jobId: runId,
      artifactPrefix: `runs/${runId}/`,
      accepted: true,
      kind: "walkforward",
      messageId,
    });
  } catch (err: any) {
    const msg = err?.issues
      ? JSON.stringify(err.issues, null, 2)
      : String(err?.message ?? err);
    return Response.json(
      { error: "WalkforwardEnqueueFailed", message: msg },
      { status: 400 }
    );
  }
}
