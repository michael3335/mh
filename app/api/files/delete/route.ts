// app/api/files/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3, BUCKET } from "@/lib/s3";
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
  type _Object,
} from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, recursive } = (await req.json()) as {
    key: string;
    recursive?: boolean;
  };

  const uid = (session.user as { id?: string }).id ?? session.user.email!;
  if (!key?.startsWith(`user/${uid}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Recursive folder delete
  if (recursive && key.endsWith("/")) {
    let token: string | undefined = undefined;

    do {
      const resp: ListObjectsV2CommandOutput = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: key,
          ContinuationToken: token,
        })
      );

      const contents: _Object[] = resp.Contents ?? [];
      token = resp.NextContinuationToken;

      await Promise.all(
        contents.map((o: _Object) =>
          s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: o.Key! }))
        )
      );
    } while (token);

    return NextResponse.json({ ok: true });
  }

  // Single object delete
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  return NextResponse.json({ ok: true });
}
