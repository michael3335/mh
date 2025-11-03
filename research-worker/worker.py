import os
import json
import time
import uuid
import signal
import sys
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Iterable

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dateutil.relativedelta import relativedelta  # pip install python-dateutil

# --------------------------------------------------------------------
# Env / clients
# --------------------------------------------------------------------
REGION = os.getenv("AWS_REGION", "ap-southeast-2")
QUEUE_URL = os.getenv("SQS_RESEARCH_JOBS_URL")
BUCKET = os.getenv("S3_BUCKET")

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
# S3 helpers
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

def s3_put_json(key: str, obj: Any):
    body = json.dumps(obj, indent=2).encode("utf-8")
    s3.put_object(Bucket=BUCKET, Key=key, Body=body, ContentType="application/json")
    log(f"Uploaded s3://{BUCKET}/{key}")

def upload_artifact(prefix: str, filename: str, content: bytes, content_type: str = "application/octet-stream"):
    key = f"{prefix.rstrip('/')}/{filename}"
    s3.put_object(Bucket=BUCKET, Key=key, Body=content, ContentType=content_type)
    log(f"Uploaded s3://{BUCKET}/{key}")

def download_strategy(manifest_key: str, dest_path: Path):
    """Fetch strategy file/zip from S3 and save locally."""
    log(f"Downloading strategy s3://{BUCKET}/{manifest_key}")
    os.makedirs(dest_path.parent, exist_ok=True)
    with open(dest_path, "wb") as f:
        s3.download_fileobj(BUCKET, manifest_key, f)
    log(f"Saved strategy to {dest_path}")

# --------------------------------------------------------------------
# Engine hook (you implement this)
# --------------------------------------------------------------------
def run_engine(
    strategy_path: Path,
    spec: Dict[str, Any],
    params: Optional[Dict[str, Any]] = None,
    phase: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Implement your actual backtest logic here (vectorbt/numba/your engine).
    This function must NOT fabricate metrics. If you don't compute them yet,
    return an object with just the keys your app expects, leaving KPIs empty.

    Expected return shape (example):
    {
      "kpis": { ... },         # or {}
      "artifacts": [           # any local files generated you want uploaded
         {"path": "/tmp/.../equity.csv", "name": "equity.csv", "content_type": "text/csv"},
      ]
    }
    """
    # Skeleton: do nothing, produce no KPIs, no artifacts.
    return {"kpis": {}, "artifacts": []}

# --------------------------------------------------------------------
# Kind handlers
# --------------------------------------------------------------------
def handle_backtest(job: Dict[str, Any], workdir: Path) -> Dict[str, Any]:
    """Run a single backtest and write metrics.json under runs/<runId>/."""
    strategy_file = workdir / "strategy_payload"
    download_strategy(job["manifestS3Key"], strategy_file)

    engine_out = run_engine(strategy_file, job.get("spec", {}), job.get("params"))
    result = {
        "runId": job["runId"],
        "strategyId": job["strategyId"],
        "kind": "backtest",
        "startedAt": datetime.utcnow().isoformat() + "Z",
        "finishedAt": datetime.utcnow().isoformat() + "Z",
        "params": job.get("params") or {},
        "kpis": engine_out.get("kpis", {}),
        "spec": job.get("spec", {}),
    }

    # Write and upload metrics.json
    metrics_path = workdir / "metrics.json"
    metrics_path.write_text(json.dumps(result, indent=2))
    upload_artifact(job["artifactPrefix"], "metrics.json", metrics_path.read_bytes(), "application/json")

    # Upload any engine artifacts
    for a in engine_out.get("artifacts", []):
        p = Path(a["path"])
        if p.exists():
            upload_artifact(job["artifactPrefix"], a.get("name", p.name), p.read_bytes(), a.get("content_type", "application/octet-stream"))

    return result

def handle_grid(job: Dict[str, Any], workdir: Path) -> Dict[str, Any]:
    """
    Iterate grid param sets, run a sub-backtest per set, and produce:
      - runs/<runId>/grid/index.json         (summary of subruns)
      - runs/<runId>/grid/<i>/metrics.json   (per subrun)
    """
    grid: List[Dict[str, Any]] = job.get("grid") or []
    if not grid:
        raise ValueError("grid is empty")

    strategy_file = workdir / "strategy_payload"
    download_strategy(job["manifestS3Key"], strategy_file)

    index: Dict[str, Any] = {
        "runId": job["runId"],
        "kind": "grid",
        "spec": job.get("spec", {}),
        "children": [],
        "startedAt": datetime.utcnow().isoformat() + "Z",
    }

    for i, params in enumerate(grid):
        child_id = f"{job['runId']}_{i:03d}"
        child_prefix = f"{job['artifactPrefix'].rstrip('/')}/grid/{i:03d}"

        subdir = workdir / f"grid_{i:03d}"
        subdir.mkdir(parents=True, exist_ok=True)

        engine_out = run_engine(strategy_file, job.get("spec", {}), params)
        child_metrics = {
            "runId": child_id,
            "parentRunId": job["runId"],
            "strategyId": job["strategyId"],
            "kind": "grid:member",
            "index": i,
            "startedAt": datetime.utcnow().isoformat() + "Z",
            "finishedAt": datetime.utcnow().isoformat() + "Z",
            "params": params,
            "kpis": engine_out.get("kpis", {}),
            "spec": job.get("spec", {}),
        }

        mpath = subdir / "metrics.json"
        mpath.write_text(json.dumps(child_metrics, indent=2))
        upload_artifact(child_prefix, "metrics.json", mpath.read_bytes(), "application/json")

        for a in engine_out.get("artifacts", []):
            p = Path(a["path"])
            if p.exists():
                upload_artifact(child_prefix, a.get("name", p.name), p.read_bytes(), a.get("content_type", "application/octet-stream"))

        # Add to index
        index["children"].append({
            "runId": child_id,
            "index": i,
            "artifactPrefix": child_prefix + "/",
            "params": params,
            "kpis": engine_out.get("kpis", {}),
        })

    index["finishedAt"] = datetime.utcnow().isoformat() + "Z"
    s3_put_json(f"{job['artifactPrefix'].rstrip('/')}/grid/index.json", index)

    # Also a top-level metrics.json for the grid parent (optional)
    parent_metrics = {
        "runId": job["runId"],
        "strategyId": job["strategyId"],
        "kind": "grid",
        "startedAt": index["startedAt"],
        "finishedAt": index["finishedAt"],
        "members": [c["runId"] for c in index["children"]],
        "spec": job.get("spec", {}),
    }
    s3_put_json(f"{job['artifactPrefix'].rstrip('/')}/metrics.json", parent_metrics)

    return parent_metrics

def month_add(dt: datetime, months: int) -> datetime:
    return dt + relativedelta(months=+months)

def wf_windows(spec: Dict[str, Any], wf: Dict[str, int]) -> Iterable[Dict[str, str]]:
    """
    Generate walk-forward windows given:
      spec.start/end (YYYY-MM-DD), spec.timeframe (string ok)
      wf.trainMonths, wf.testMonths, wf.stepMonths
    Yields dicts with ISO date strings for train/test.
    """
    start = datetime.fromisoformat(spec["start"])
    end = datetime.fromisoformat(spec["end"])
    train_m = int(wf["trainMonths"])
    test_m  = int(wf["testMonths"])
    step_m  = int(wf["stepMonths"])

    cursor = start
    while True:
        train_start = cursor
        train_end   = month_add(train_start, train_m)
        test_start  = train_end
        test_end    = month_add(test_start, test_m)

        if test_start >= end:
            break

        yield {
            "trainStart": train_start.date().isoformat(),
            "trainEnd":   train_end.date().isoformat(),
            "testStart":  test_start.date().isoformat(),
            "testEnd":    min(test_end, end).date().isoformat(),
        }

        cursor = month_add(cursor, step_m)
        if cursor >= end:
            break

def handle_walkforward(job: Dict[str, Any], workdir: Path) -> Dict[str, Any]:
    """
    Produce rolling windows and run engine for each.
    Artifacts:
      - runs/<runId>/wf/index.json           (summary)
      - runs/<runId>/wf/<i>/metrics.json     (per window test result)
    """
    wf = job.get("walkforward")
    if not wf:
        raise ValueError("walkforward spec missing")

    strategy_file = workdir / "strategy_payload"
    download_strategy(job["manifestS3Key"], strategy_file)

    spec = job.get("spec", {})
    idx: Dict[str, Any] = {
        "runId": job["runId"],
        "kind": "walkforward",
        "spec": spec,
        "wf": wf,
        "windows": [],
        "startedAt": datetime.utcnow().isoformat() + "Z",
    }

    for i, w in enumerate(wf_windows(spec, wf)):
        child_id = f"{job['runId']}_wf_{i:03d}"
        child_prefix = f"{job['artifactPrefix'].rstrip('/')}/wf/{i:03d}"
        subdir = workdir / f"wf_{i:03d}"
        subdir.mkdir(parents=True, exist_ok=True)

        # You can pass window info into your engine via params
        params = {"wfWindow": w}

        engine_out = run_engine(strategy_file, spec, params, phase="walkforward_test")
        child_metrics = {
            "runId": child_id,
            "parentRunId": job["runId"],
            "strategyId": job["strategyId"],
            "kind": "walkforward:window",
            "index": i,
            "window": w,
            "startedAt": datetime.utcnow().isoformat() + "Z",
            "finishedAt": datetime.utcnow().isoformat() + "Z",
            "params": params,
            "kpis": engine_out.get("kpis", {}),
            "spec": spec,
        }

        mpath = subdir / "metrics.json"
        mpath.write_text(json.dumps(child_metrics, indent=2))
        upload_artifact(child_prefix, "metrics.json", mpath.read_bytes(), "application/json")

        for a in engine_out.get("artifacts", []):
            p = Path(a["path"])
            if p.exists():
                upload_artifact(child_prefix, a.get("name", p.name), p.read_bytes(), a.get("content_type", "application/octet-stream"))

        idx["windows"].append({
            "runId": child_id,
            "index": i,
            "artifactPrefix": child_prefix + "/",
            "window": w,
            "kpis": engine_out.get("kpis", {}),
        })

    idx["finishedAt"] = datetime.utcnow().isoformat() + "Z"
    s3_put_json(f"{job['artifactPrefix'].rstrip('/')}/wf/index.json", idx)

    # Optional parent metrics
    parent_metrics = {
        "runId": job["runId"],
        "strategyId": job["strategyId"],
        "kind": "walkforward",
        "startedAt": idx["startedAt"],
        "finishedAt": idx["finishedAt"],
        "windows": [w["runId"] for w in idx["windows"]],
        "spec": spec,
        "wf": wf,
    }
    s3_put_json(f"{job['artifactPrefix'].rstrip('/')}/metrics.json", parent_metrics)

    return parent_metrics

# --------------------------------------------------------------------
# Main loop
# --------------------------------------------------------------------
def main():
    print(">>> worker.py starting up", flush=True)
    print("REGION:", os.environ.get("AWS_REGION"))
    print("QUEUE_URL:", os.environ.get("SQS_RESEARCH_JOBS_URL"))
    print("BUCKET:", os.environ.get("S3_BUCKET"))

    if not ensure_env_ready():
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
        try:
            resp = sqs.receive_message(
                QueueUrl=QUEUE_URL,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,
                VisibilityTimeout=900,
            )
        except Exception as e:
            log(f"ERROR: receive_message failed: {e}")
            time.sleep(min(backoff, 30))
            backoff = min(backoff * 2, 30)
            try:
                global sqs
                sqs = mk_sqs()
            except Exception as e2:
                log(f"ERROR: recreating SQS client failed: {e2}")
            continue

        backoff = 1
        msgs = resp.get("Messages", [])
        if not msgs:
            idle_ticks += 1
            if idle_ticks % 6 == 0:
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
        kind = (job.get("kind") or "backtest").lower()

        log(f"Processing job runId={run_id} kind={kind}")
        workdir = base_workdir / run_id
        workdir.mkdir(parents=True, exist_ok=True)

        try:
            if kind == "backtest":
                _ = handle_backtest(job, workdir)
            elif kind == "grid":
                _ = handle_grid(job, workdir)
            elif kind == "walkforward":
                _ = handle_walkforward(job, workdir)
            else:
                raise ValueError(f"Unknown job kind: {kind}")

            if receipt:
                sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt)
            log(f"✅ Completed job {run_id} (artifacts under s3://{BUCKET}/{prefix})")

        except Exception as e:
            log(f"❌ Job {run_id} failed: {e}")
            traceback.print_exc()
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