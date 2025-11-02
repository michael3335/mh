import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3 } from "@/lib/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // optional, avoids caching surprises

const BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;
const NOTE_KEY = process.env.NOTE_KEY || "notes/quicknote.html";
const VERSIONS_PREFIX = process.env.NOTE_VERSIONS_PREFIX || "notes/versions/";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: NOTE_KEY })
    );
    const body = await res.Body?.transformToString("utf-8");
    return new NextResponse(body ?? "", {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NoSuchKey") {
      return new NextResponse("", {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return NextResponse.json(
      { error: err?.message ?? "Failed to load note" },
      { status: 500 }
    );
  }
}

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const html = await req.text();
  const safeHtml = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

  const baseName = NOTE_KEY.split("/")
    .pop()!
    .replace(/\.[^.]+$/, "");
  const ext = NOTE_KEY.endsWith(".html") ? ".html" : "";
  const versionKey = `${VERSIONS_PREFIX}${baseName}-${ts()}${ext}`;

  try {
    // 1) Write latest
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: NOTE_KEY,
        Body: safeHtml,
        ContentType: "text/html; charset=utf-8",
        CacheControl: "no-store",
        Metadata: {
          savedby: session.user?.email || session.user?.name || "unknown",
        },
      })
    );

    // 2) Write versioned snapshot
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: versionKey,
        Body: safeHtml,
        ContentType: "text/html; charset=utf-8",
        CacheControl: "no-store",
        Metadata: {
          snapshot: "true",
          savedby: session.user?.email || session.user?.name || "unknown",
        },
      })
    );

    return NextResponse.json({ ok: true, versionKey }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to save note" },
      { status: 500 }
    );
  }
}
