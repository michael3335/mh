import os
import json
import time
import uuid
import traceback
import signal
import sys
from datetime import datetime
from pathlib import Path

print(">>> worker.py starting up", flush=True)
print("REGION:", os.environ.get("AWS_REGION"))
print("QUEUE_URL:", os.environ.get("SQS_RESEARCH_JOBS_URL"))
print("BUCKET:", os.environ.get("S3_BUCKET"))

# --------------------------------------------------------------------
# Env / clients
# --------------------------------------------------------------------
REGION = os.environ.get("AWS_REGION", "ap-southeast-2")
QUEUE_URL = os.environ.get("SQS_RESEARCH_JOBS_URL")
BUCKET = os.environ.get("S3_BUCKET")

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except Exception as e:
    print("BOOTSTRAP ERROR (imports):", e, flush=True)
    traceback.print_exc()
    raise

def mk_sqs():
    return boto3.client("sqs", region_name=REGION)

def mk_s3():
    return boto3.client("s3", region_name=REGION)

sqs = mk_sqs()
s3 = mk_s3()

# --------------------------------------------------------------------
# Logging / signals
# --------------------------------------------------------------------
STOP = False

def log(msg: str):
    print(f"[{datetime.utcnow().isoformat()}Z] {msg}", flush=True)

def handle_sigterm(_signo, _frame):
    global STOP
    STOP = True
    log("Received SIGTERM, will exit after current iteration…")

signal.signal(signal.SIGTERM, handle_sigterm)
signal.signal(signal.SIGINT, handle_sigterm)

# --------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------
def ensure_env_ready() -> bool:
    ok = True
    if not REGION:
        log("ERROR: AWS_REGION is not set")
        ok = False
    if not QUEUE_URL:
        log("ERROR: SQS_RESEARCH_JOBS_URL is not set")
        ok = False
    if not BUCKET:
        log("ERROR: S3_BUCKET is not set")
        ok = False
    return ok

def download_strategy(manifest_key: str, dest_path: Path):
    """Fetch strategy file/zip from S3 and save locally."""
    log(f"Downloading strategy s3://{BUCKET}/{manifest_key}")
    os.makedirs(dest_path.parent, exist_ok=True)
    try:
        with open(dest_path, "wb") as f:
            s3.download_fileobj(BUCKET, manifest_key, f)
    except (BotoCoreError, ClientError) as e:
        raise RuntimeError(f"Failed to download strategy {manifest_key}: {e}") from e
    log(f"Saved strategy to {dest_path}")

def upload_artifact(prefix: str, filename: str, content: bytes, content_type: str = "application/octet-stream"):
    """Upload bytes to S3 under runs/<runId>/..."""
    key = f"{prefix.rstrip('/')}/{filename}"
    try:
        s3.put_object(Bucket=BUCKET, Key=key, Body=content, ContentType=content_type)
        log(f"Uploaded s3://{BUCKET}/{key}")
    except (BotoCoreError, ClientError) as e:
        log(f"ERROR: Failed to upload {key}: {e}")

def run_research_job(job: dict, workdir: Path):
    """
    Hook your real backtesting / grid / WF logic here.
    This skeleton only handles IO and schema; it does NOT fabricate metrics.
    """
    workdir.mkdir(parents=True, exist_ok=True)

    # Expect strategies/<strategyId>/<commit or main>.py (or .zip) in S3.
    strategy_file = workdir / "strategy_payload"
    download_strategy(job["manifestS3Key"], strategy_file)

    # TODO: integrate your engine (vectorbt/numba/your runner) and
    #       populate 'kpis' and CSV artifacts for upload.
    result = {
        "runId": job["runId"],
        "strategyId": job["strategyId"],
        "kind": job["kind"],
        "startedAt": datetime.utcnow().isoformat() + "Z",
        "finishedAt": datetime.utcnow().isoformat() + "Z",
        "params": job.get("params") or job.get("grid") or {},
        "kpis": {},  # fill with actual computed KPIs
        "spec": job.get("spec", {}),
    }

    metrics_path = workdir / "metrics.json"
    metrics_path.write_text(json.dumps(result, indent=2))
    upload_artifact(job["artifactPrefix"], "metrics.json", metrics_path.read_bytes(), "application/json")

    # Optional: upload any engine-produced files if present
    for fname in ("equity.csv", "drawdown.csv", "trades.csv", "logs.txt"):
        f = workdir / fname
        if f.exists():
            upload_artifact(job["artifactPrefix"], f.name, f.read_bytes())

    return result

# --------------------------------------------------------------------
# Main loop
# --------------------------------------------------------------------
def main():
    global sqs, s3

    if not ensure_env_ready():
        # Keep the container alive so logs are visible
        while not STOP:
            log("Waiting for required env vars (AWS_REGION, SQS_RESEARCH_JOBS_URL, S3_BUCKET)…")
            time.sleep(10)
        return

    log(f"Starting research worker in region={REGION}")
    log(f"Queue: {QUEUE_URL}")
    log(f"Bucket: {BUCKET}")

    base_workdir = Path("/tmp/workdir")
    base_workdir.mkdir(parents=True, exist_ok=True)

    idle_ticks = 0
    backoff = 1

    while not STOP:
        # Receive
        try:
            resp = sqs.receive_message(
                QueueUrl=QUEUE_URL,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,       # long poll
                VisibilityTimeout=900,    # match longest expected run
            )
        except Exception as e:
            log(f"ERROR: receive_message failed: {e}")
            time.sleep(min(backoff, 30))
            backoff = min(backoff * 2, 30)
            # Recreate clients in case of transient issues
            try:
                sqs = mk_sqs()
                s3 = mk_s3()
            except Exception as e2:
                log(f"ERROR: recreating AWS clients failed: {e2}")
            continue

        backoff = 1  # reset backoff on success
        msgs = resp.get("Messages", [])
        if not msgs:
            idle_ticks += 1
            if idle_ticks % 6 == 0:  # about every 2 minutes at 20s polls
                log("Idle: no messages")
            continue

        idle_ticks = 0

        m = msgs[0]
        receipt = m.get("ReceiptHandle")
        body = m.get("Body", "{}")

        try:
            job = json.loads(body)
        except json.JSONDecodeError:
            log("ERROR: received non-JSON message; deleting to skip")
            if receipt:
                try:
                    sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt)
                except Exception as e:
                    log(f"ERROR: delete_message failed for bad JSON: {e}")
            continue

        run_id = job.get("runId") or f"r_{uuid.uuid4()}"
        prefix = job.get("artifactPrefix") or f"runs/{run_id}/"
        kind = job.get("kind")

        log(f"Processing job runId={run_id} kind={kind}")

        workdir = base_workdir / run_id
        try:
            _ = run_research_job(job, workdir)
            if receipt:
                sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt)
            log(f"✅ Completed job {run_id} (artifacts under s3://{BUCKET}/{prefix})")
        except Exception as e:
            log(f"❌ Job {run_id} failed: {e}")
            traceback.print_exc()
            # Leave on queue for DLQ/redrive
            time.sleep(5)

    log("Exiting worker main loop")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"FATAL: worker crashed: {e}")
        traceback.print_exc()
        time.sleep(2)
        sys.exit(1)