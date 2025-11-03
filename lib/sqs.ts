// lib/sqs.ts
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export const sqs = new SQSClient({ region: process.env.AWS_REGION! });
export async function sendJson(queueUrl: string, payload: unknown) {
  const cmd = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(payload),
  });
  const res = await sqs.send(cmd);
  return res.MessageId!;
}
