// app/api/insights/draft/[slug]/route.ts
import { NextResponse } from "next/server";
import { s3, BUCKET } from "@/lib/s3";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  _: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  const base = `insights/_drafts/${encodeURIComponent(slug)}`;
  try {
    await s3.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: `${base}/meta.json` })
    );
  } catch {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const [metaObj, contentObj] = await Promise.all([
    s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: `${base}/meta.json` })),
    s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: `${base}/content.md` })
    ),
  ]);
  const [metaText, mdText] = await Promise.all([
    metaObj.Body!.transformToString(),
    contentObj.Body!.transformToString(),
  ]);

  return NextResponse.json({ meta: JSON.parse(metaText), content: mdText });
}
