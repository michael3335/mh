// lib/s3.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// -----------------------------------------------------------------------------
// Environment
// -----------------------------------------------------------------------------
const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;

if (!REGION) throw new Error("AWS_REGION is not set");
if (!BUCKET) throw new Error("S3_BUCKET (or AWS_S3_BUCKET) is not set");

// -----------------------------------------------------------------------------
// Client
// -----------------------------------------------------------------------------
// In ECS/Fargate, credentials are automatically provided by the task role.
// Locally (dev), AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY can be set.
export const s3 = new S3Client({
  region: REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      : undefined,
});

export { BUCKET };

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
/** Normalize a user-relative S3 path */
export const userPrefix = (userId: string, path = "") =>
  `user/${userId}${path ? `/${path.replace(/^\/+|\/+$/g, "")}` : ""}`;

/** Write text content to S3 */
export async function putText(
  key: string,
  text: string,
  contentType = "text/plain"
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: text,
      ContentType: contentType,
    })
  );
}

/** Read text content from S3 */
export async function getText(key: string): Promise<string> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return await res.Body!.transformToString("utf-8");
}
