import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { ResearchJob } from "@/lib/contracts";
import { sendJson } from "@/lib/sqs";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authz = requireRole(session, "researcher");
  if (!authz.ok) return authz.response;
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
