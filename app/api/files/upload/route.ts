import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3, BUCKET, userPrefix } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType, path = "" } = await req.json();
  if (!filename) {
    return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  }

  const uid = (session.user as { id?: string }).id ?? session.user.email!;
  const key = userPrefix(uid, `${path}/${filename}`);

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    }),
    { expiresIn: 60 } // seconds
  );

  return NextResponse.json({ url, key });
}
