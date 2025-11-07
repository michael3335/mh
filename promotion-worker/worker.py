import json
import os
import time
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError
import psycopg


REGION = os.getenv("AWS_REGION", "ap-southeast-2")
QUEUE_URL = os.getenv("SQS_PROMOTION_JOBS_URL")
BUCKET = os.getenv("AWS_S3_BUCKET")
DATABASE_URL = os.getenv("DATABASE_URL")

sqs = boto3.client("sqs", region_name=REGION)
s3 = boto3.client("s3", region_name=REGION)


def ensure_env():
  missing = [key for key, value in {
    "SQS_PROMOTION_JOBS_URL": QUEUE_URL,
    "AWS_S3_BUCKET": BUCKET,
    "DATABASE_URL": DATABASE_URL,
  }.items() if not value]
  if missing:
    raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")


class PromotionStore:
  def __init__(self, url: str):
    self.url = url
    self.conn = psycopg.connect(url)
    self.conn.autocommit = True

  def update_status(self, promotion_id: Optional[str], status: str, error: Optional[str] = None):
    if not promotion_id:
      return
    with self.conn.cursor() as cur:
      cur.execute(
        'UPDATE "Promotion" SET status=%s, error=%s, "updatedAt"=NOW() WHERE id=%s',
        (status.upper(), error, promotion_id),
      )

  def close(self):
    self.conn.close()


def log(msg: str):
  print(f"[promotion-worker] {msg}", flush=True)


def copy_config(artifact_prefix: str, bot_id: str):
  src_key = f"{artifact_prefix.rstrip('/')}/config.json"
  dest_key = f"bots/{bot_id}/config.json"
  try:
    s3.copy_object(
      Bucket=BUCKET,
      CopySource={"Bucket": BUCKET, "Key": src_key},
      Key=dest_key,
    )
    log(f"Copied {src_key} -> {dest_key}")
  except ClientError as exc:
    if exc.response.get("Error", {}).get("Code") == "NoSuchKey":
      log(f"No config found at {src_key}; skipping copy")
    else:
      raise


def process_job(job: Dict[str, Any], store: PromotionStore):
  promotion_id = job.get("promotionId")
  try:
    bot_id = job["botId"]
    artifact_prefix = job.get("artifactPrefix") or f"runs/{job['runId']}/"

    copy_config(artifact_prefix, bot_id)

    store.update_status(promotion_id, "SUCCEEDED")
    log(f"Promotion {promotion_id or '(ephemeral)'} completed")
  except Exception as exc:
    log(f"Promotion {promotion_id or '(ephemeral)'} failed: {exc}")
    store.update_status(promotion_id, "FAILED", str(exc))
    raise


def main():
  ensure_env()
  store = PromotionStore(DATABASE_URL)
  log("Started promotion worker loop")

  try:
    while True:
      resp = sqs.receive_message(
        QueueUrl=QUEUE_URL,
        MaxNumberOfMessages=1,
        WaitTimeSeconds=15,
        VisibilityTimeout=300,
      )
      messages = resp.get("Messages", [])
      if not messages:
        continue

      msg = messages[0]
      body = json.loads(msg["Body"])

      try:
        process_job(body, store)
        sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=msg["ReceiptHandle"])
      except Exception:
        # Leave the message in the queue for retries
        time.sleep(5)
  finally:
    store.close()


if __name__ == "__main__":
  try:
    main()
  except Exception as err:
    log(f"Fatal error: {err}")
    raise
