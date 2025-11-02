import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3 } from "@/lib/s3";
import { CopyObjectCommand } from "@aws-sdk/client-s3";
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // optional, avoids caching surprises

const BUCKET = process.env.S3_BUCKET!;
const NOTE_KEY = process.env.NOTE_KEY || "notes/quicknote.html";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await req.json();
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  try {
    await s3.send(
      new CopyObjectCommand({
        Bucket: BUCKET,
        Key: NOTE_KEY,
        CopySource: `/${encodeURIComponent(BUCKET)}/${encodeURIComponent(key)}`,
        MetadataDirective: "REPLACE",
        ContentType: "text/html; charset=utf-8",
        CacheControl: "no-store",
        Metadata: {
          revertedfrom: key,
          revertedby: session.user?.email || session.user?.name || "unknown",
        },
      })
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to revert" },
      { status: 500 }
    );
  }
}
