import { NextRequest } from "next/server";
import { z } from "zod";
import { ResearchJob } from "@/lib/contracts";
import { sendJson } from "@/lib/sqs";

// Minimal WF spec; adjust to your worker's needs
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
    const artifactPrefix = `runs/${crypto.randomUUID()}/`;

    // Base job per ResearchJob
    const baseJob = ResearchJob.parse({
      runId,
      strategyId: body.strategy,
      manifestS3Key: `strategies/${encodeURIComponent(body.strategy)}/main.py`,
      artifactPrefix,
      kind: "walkforward",
      spec: {
        exchange: body.dataset?.exchange,
        pair: String(body.dataset?.pairs ?? "")
          .split(",")[0]
          .trim(),
        timeframe: body.dataset?.timeframe,
        start: body.dataset?.from,
        end: body.dataset?.to,
      },
    });

    // Include WF spec alongside the validated job (ResearchJob will strip unknowns,
    // so we add it after for the SQS payload)
    const payload = { ...baseJob, walkforward: wf } as any;

    const queueUrl = process.env.SQS_RESEARCH_JOBS_URL;
    if (!queueUrl) {
      return Response.json(
        { error: "Missing SQS_RESEARCH_JOBS_URL" },
        { status: 500 }
      );
    }

    const messageId = await sendJson(queueUrl, payload);
    return Response.json({
      jobId: runId,
      accepted: true,
      kind: "walkforward",
      messageId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /trainMonths|testMonths|stepMonths/.test(msg) ? 400 : 500;
    return Response.json(
      { error: "WalkforwardEnqueueFailed", message: msg },
      { status }
    );
  }
}
