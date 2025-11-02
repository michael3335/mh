import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3, BUCKET, userPrefix } from "@/lib/s3";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = req.nextUrl.searchParams;
  const path = (search.get("prefix") || "").replace(/^\/+/, "");
  const cursor = search.get("cursor") || undefined;

  const uid = (session.user as { id?: string }).id ?? session.user.email!;
  const Prefix = userPrefix(uid, path);
  const cmd = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: Prefix.endsWith("/") ? Prefix : `${Prefix}/`,
    Delimiter: "/", // gives CommonPrefixes for "folders"
    ContinuationToken: cursor,
    MaxKeys: 50,
  });

  const out = await s3.send(cmd);

  const folders = (out.CommonPrefixes ?? []).map((p) => ({
    kind: "folder" as const,
    name: p.Prefix!.slice(Prefix.length).replace(/\/$/, ""),
    key: p.Prefix!,
  }));

  const files = (out.Contents ?? [])
    .filter((o) => o.Key !== Prefix) // ignore dir marker
    .map((o) => ({
      kind: "file" as const,
      name: o.Key!.slice(Prefix.length),
      key: o.Key!,
      size: o.Size ?? 0,
      etag: o.ETag,
      lastModified: o.LastModified,
      url: `/api/files/download?key=${encodeURIComponent(o.Key!)}`,
    }));

  return NextResponse.json({
    path,
    folders,
    files,
    nextCursor: out.NextContinuationToken ?? null,
  });
}
