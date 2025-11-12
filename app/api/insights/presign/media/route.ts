// app/api/insights/presign/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { s3, BUCKET } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: NextRequest) {
  const { slug, filename, contentType, draft } = await req.json();
  if (!slug || !filename) {
    return NextResponse.json(
      { error: "slug and filename required" },
      { status: 400 }
    );
  }

  const base = draft
    ? `insights/_drafts/${encodeURIComponent(slug)}`
    : `insights/${encodeURIComponent(slug)}`;
  const Key = `${base}/media/${filename}`;

  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key,
    ContentType: contentType || "application/octet-stream",
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });
  return NextResponse.json({ url, key: Key });
}
