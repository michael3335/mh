// app/api/models/runs/route.ts
import { s3 } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { mapRunRow, type RunRow, type KPIs } from "@/lib/serializers/run";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const session = await getServerSession(authOptions);
  const authz = await requireRole(session, "researcher");
  if (!authz.ok) return authz.response;
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
  if (!bucket) {
    return new Response(JSON.stringify({ error: "S3_BUCKET not set" }), {
      status: 500,
    });
  }
  const userId = getSessionUserId(session);

  try {
    const dbRuns = await fetchRunsFromDb(userId ?? undefined);
    if (dbRuns?.length) {
      return Response.json({ runs: dbRuns });
    }
    const fallback = await fetchRunsFromS3(bucket);
    return Response.json({ runs: fallback });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown");
    return new Response(
      JSON.stringify({ error: "ListRunsFailed", message }),
      { status: 500 }
    );
  }
}

async function fetchRunsFromDb(
  userId?: string,
  limit = 25
): Promise<RunRow[] | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const rows = await prisma.run.findMany({
      where: userId ? { ownerId: userId } : undefined,
      include: { strategy: { select: { name: true } } },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return rows.map(mapRunRow);
  } catch (error) {
    console.warn("[runs] DB fallback", error);
    return null;
  }
}

async function fetchRunsFromS3(bucket: string): Promise<RunRow[]> {
    // 1) List all metrics.json objects under runs/
    //    (You can tune MaxKeys if you have many; we’ll grab up to 200 then fetch the latest 25)
    const listed = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: "runs/",
        MaxKeys: 200,
      })
    );

    const items = (listed.Contents ?? [])
      .filter((o) => o.Key?.endsWith("/metrics.json"))
      .sort((a, b) => {
        const ta = a.LastModified?.getTime() ?? 0;
        const tb = b.LastModified?.getTime() ?? 0;
        return tb - ta; // newest first
      })
      .slice(0, 25);

    // 2) Fetch & parse each metrics.json
    const runs: RunRow[] = [];
    for (const obj of items) {
      const key = obj.Key!;
      try {
        const res = await s3.send(
          new GetObjectCommand({ Bucket: bucket, Key: key })
        );
        const text = await res.Body?.transformToString("utf-8");
        if (!text) continue;
        const m = JSON.parse(text);

        // Map metrics.json → RunRow shape for your table
        const kpis: KPIs = {
          cagr: m?.kpis?.cagr ?? null,
          mdd: m?.kpis?.maxDD ?? m?.kpis?.mdd, // support either field name
          sharpe: m?.kpis?.sharpe ?? null,
          trades: m?.kpis?.trades,
        };

        const startedAt =
          m?.startedAt ??
          obj.LastModified?.toISOString() ??
          new Date().toISOString();
        const finishedAt = m?.finishedAt ?? null;

        // If you later write job status into metrics, read it; otherwise SUCCEEDED since artifact exists
        const status: RunRow["status"] = "SUCCEEDED";

        runs.push({
          id: m?.runId ?? key.split("/")[1], // "runs/<id>/metrics.json"
          strategyName: m?.strategyId ?? "unknown",
          kind: (m?.kind ?? "backtest") as RunRow["kind"],
          status,
          startedAt,
          finishedAt,
          kpis,
        });
      } catch {
        // Skip unreadable objects
      }
    }

    return runs;
}
