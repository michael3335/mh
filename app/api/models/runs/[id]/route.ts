// app/api/models/runs/[id]/route.ts
import { NextRequest } from "next/server";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

// Next.js 16: context.params is now a Promise
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
  if (!bucket) {
    return new Response(JSON.stringify({ error: "S3_BUCKET not set" }), {
      status: 500,
    });
  }

  const runId = decodeURIComponent(id);
  const key = `runs/${runId}/metrics.json`;

  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const body = await res.Body?.transformToString("utf-8");

    if (!body) {
      return new Response(JSON.stringify({ error: "Empty object body" }), {
        status: 404,
      });
    }

    // Return the raw metrics.json contents
    return new Response(body, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    const code = err?.$metadata?.httpStatusCode ?? 500;
    const msg = err?.message ?? String(err);
    return new Response(
      JSON.stringify({ error: "GetRunFailed", message: msg }),
      { status: code }
    );
  }
}
