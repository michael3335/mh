import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { s3, BUCKET } from "@/lib/s3";
import { resolveArtifactPrefix } from "@/lib/run-artifacts";
import { getSessionUserId } from "@/lib/session";

const CONTENT_TYPES: Record<string, string> = {
  metrics: "application/json",
  equity: "text/csv",
  drawdown: "text/csv",
  trades: "text/csv",
  logs: "text/plain",
};

const EXTENSIONS: Record<string, string> = {
  metrics: "json",
  equity: "csv",
  drawdown: "csv",
  trades: "csv",
  logs: "txt",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; asset: string }> }
) {
  const session = await getServerSession(authOptions);
  const authz = await requireRole(session, "researcher");
  if (!authz.ok) return authz.response;
  const ownerId = getSessionUserId(session);

  const { id, asset } = await ctx.params;
  const runId = decodeURIComponent(id);
  const assetKey = asset?.toLowerCase();
  if (!assetKey || !(assetKey in EXTENSIONS)) {
    return Response.json({ error: "UnsupportedArtifact" }, { status: 400 });
  }

  if (!BUCKET) {
    return Response.json({ error: "S3_BUCKET not set" }, { status: 500 });
  }

  const extension = EXTENSIONS[assetKey];
  const resolvedPrefix =
    (await resolveArtifactPrefix(runId, ownerId)) ?? `runs/${runId}/`;
  const prefix = resolvedPrefix.endsWith("/")
    ? resolvedPrefix
    : `${resolvedPrefix}/`;
  const key = `${prefix}${assetKey}.${extension}`;

  try {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );

    if (!res.Body) {
      return Response.json({ error: "ArtifactEmpty" }, { status: 404 });
    }

    const stream = res.Body.transformToWebStream();
    const type =
      CONTENT_TYPES[assetKey] ||
      res.ContentType ||
      "application/octet-stream";
    return new Response(stream, {
      status: 200,
      headers: {
        "content-type": type,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const code =
      typeof error === "object" &&
      error &&
      "$metadata" in error &&
      typeof (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode === "number"
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata!
            .httpStatusCode!
        : 500;
    return Response.json(
      { error: "ArtifactFetchFailed", message: String(error) },
      { status: code }
    );
  }
}
