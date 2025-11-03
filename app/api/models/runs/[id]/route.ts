// app/api/models/runs/[id]/route.ts
import { NextRequest } from "next/server";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    return new Response(JSON.stringify({ error: "S3_BUCKET not set" }), {
      status: 500,
    });
  }

  const runId = decodeURIComponent(params.id);
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
    // Return the raw metrics.json
    return new Response(body, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    const code = err?.$metadata?.httpStatusCode ?? 500;
    return new Response(
      JSON.stringify({ error: "GetRunFailed", message: String(err) }),
      { status: code }
    );
  }
}
