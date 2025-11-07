import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3 } from "@/lib/s3";
import { CopyObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Narrow envs to string (and fail fast if missing)
const _BUCKET = process.env.AWS_S3_BUCKET ?? process.env.S3_BUCKET;
if (!_BUCKET) {
  throw new Error("Missing env var AWS_S3_BUCKET (or S3_BUCKET)");
}
const BUCKET: string = _BUCKET;

const NOTE_KEY = process.env.NOTE_KEY || "notes/quicknote.html";

type RevertBody = { key?: unknown };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = ((await req.json().catch(() => ({}))) ?? {}) as RevertBody;
  const key: unknown = body.key;
  if (typeof key !== "string" || !key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    // CopySource should be "bucket/key", with each segment URL-encoded (no leading slash)
    const copySource = `${encodeURIComponent(BUCKET)}/${encodeURIComponent(
      key
    )}`;

    await s3.send(
      new CopyObjectCommand({
        Bucket: BUCKET,
        Key: NOTE_KEY,
        CopySource: copySource,
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
  } catch (error) {
    console.error("POST /api/note/revert error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to revert";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
