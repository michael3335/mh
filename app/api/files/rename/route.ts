import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3, BUCKET } from "@/lib/s3";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fromKey, toKey } = await req.json();
  const uid = (session.user as { id?: string }).id ?? session.user.email!;
  const base = `user/${uid}/`;
  if (!fromKey?.startsWith(base) || !toKey?.startsWith(base)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `/${BUCKET}/${encodeURIComponent(fromKey)}`,
      Key: toKey,
    })
  );
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fromKey }));

  return NextResponse.json({ ok: true });
}
