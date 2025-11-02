import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3, BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const key = req.nextUrl.searchParams.get("key")!;
  const uid = (session.user as { id?: string }).id ?? session.user.email!;
  if (!key.startsWith(`user/${uid}/`)) {
    return new Response("Forbidden", { status: 403 });
  }

  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));

  // obj.Body is a Node.js Readable; convert to Web stream for Fetch Response
  const nodeReadable = obj.Body as unknown as Readable;
  const webStream = Readable.toWeb(nodeReadable) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Type": obj.ContentType || "application/octet-stream",
      "Content-Length": String(obj.ContentLength ?? 0),
      "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
      ETag: obj.ETag ?? "",
    },
  });
}
