import { NextRequest } from "next/server";
import { ResearchJob } from "@/lib/contracts";
import { sendJson } from "@/lib/sqs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const runId = `r_${crypto.randomUUID()}`;
    const job = ResearchJob.parse({
      runId,
      strategyId: body.strategy,
      manifestS3Key: `strategies/${encodeURIComponent(body.strategy)}/main.py`,
      artifactPrefix: `runs/${runId}/`, // artifacts tie to runId
      kind: "backtest",
      spec: {
        exchange: body?.dataset?.exchange,
        pair: String(body?.dataset?.pairs ?? "")
          .split(",")[0]
          ?.trim(),
        timeframe: body?.dataset?.timeframe,
        start: body?.dataset?.from,
        end: body?.dataset?.to,
      },
      params: body?.params ?? {},
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
  } catch (err: any) {
    const msg = err?.issues
      ? { zodIssues: err.issues }
      : err?.message
      ? { message: err.message }
      : { error: "Unknown error" };
    return new Response(JSON.stringify({ ok: false, ...msg }), { status: 400 });
  }
}
