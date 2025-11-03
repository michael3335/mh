// app/api/models/jobs/backtest/route.ts
import { NextRequest } from "next/server";
import { ResearchJob } from "@/lib/contracts";
import { sendJson } from "@/lib/sqs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  // shape from UI → transform to ResearchJob
  const job = ResearchJob.parse({
    runId: `r_${crypto.randomUUID()}`,
    strategyId: body.strategy,
    manifestS3Key: `strategies/${encodeURIComponent(body.strategy)}/main.py`, // or your zip key
    artifactPrefix: `runs/${crypto.randomUUID()}/`,
    kind: "backtest",
    spec: {
      exchange: body.dataset.exchange,
      pair: String(body.dataset.pairs).split(",")[0].trim(),
      timeframe: body.dataset.timeframe,
      start: body.dataset.from,
      end: body.dataset.to,
    },
  });

  // send to SQS
  const queueUrl = process.env.SQS_RESEARCH_JOBS_URL!;
  const messageId = await sendJson(queueUrl, job);

  return Response.json({ jobId: job.runId, accepted: true, messageId });
}
