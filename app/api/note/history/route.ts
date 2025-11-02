import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3 } from "@/lib/s3";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

const BUCKET = process.env.S3_BUCKET!;
const VERSIONS_PREFIX = process.env.NOTE_VERSIONS_PREFIX || "notes/versions/";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.max(
    1,
    Math.min(100, Number(searchParams.get("limit") ?? 25))
  );

  try {
    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: VERSIONS_PREFIX,
        MaxKeys: limit,
      })
    );

    const items =
      (out.Contents ?? [])
        .sort(
          (a, b) =>
            (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0)
        )
        .map((o) => ({
          key: o.Key!,
          size: o.Size ?? 0,
          lastModified: o.LastModified?.toISOString() ?? null,
        })) ?? [];

    return NextResponse.json({ items }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to list versions" },
      { status: 500 }
    );
  }
}
