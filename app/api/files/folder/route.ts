import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3, BUCKET, userPrefix } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, path = "" } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const uid = (session.user as { id?: string }).id ?? session.user.email!;
  const key = userPrefix(uid, `${path}/${name}`) + "/";

  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: "" }));
  return NextResponse.json({ ok: true, key });
}
