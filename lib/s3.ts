import { S3Client } from "@aws-sdk/client-s3";
import { env } from "process";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET = process.env.AWS_S3_BUCKET!;
export const userPrefix = (userId: string, path = "") =>
  `user/${userId}${path ? `/${path.replace(/^\/+|\/+$/g, "")}` : ""}`;
