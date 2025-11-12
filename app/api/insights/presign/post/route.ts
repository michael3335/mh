// app/api/insights/presign/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { s3, BUCKET } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: NextRequest) {
  const { slug, draft } = await req.json();
  if (!slug)
    return NextResponse.json({ error: "slug required" }, { status: 400 });

  const base = draft
    ? `insights/_drafts/${encodeURIComponent(slug)}`
    : `insights/${encodeURIComponent(slug)}`;
  const contentKey = `${base}/content.md`;
  const metaKey = `${base}/meta.json`;

  const [contentUrl, metaUrl] = await Promise.all([
    getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: contentKey,
        ContentType: "text/markdown; charset=utf-8",
      }),
      { expiresIn: 60 }
    ),
    getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: metaKey,
        ContentType: "application/json; charset=utf-8",
      }),
      { expiresIn: 60 }
    ),
  ]);

  return NextResponse.json({
    content: { url: contentUrl, key: contentKey },
    meta: { url: metaUrl, key: metaKey },
  });
}
