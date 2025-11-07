import os
import json
import time
import uuid
import signal
import sys
import math
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Iterable

import boto3
import ccxt
import numpy as np
import pandas as pd
import psycopg
import vectorbt as vbt
from botocore.exceptions import BotoCoreError, ClientError
from dateutil.relativedelta import relativedelta  # pip install python-dateutil
from psycopg.types.json import Json

# --------------------------------------------------------------------
# Env / clients
# --------------------------------------------------------------------
REGION = os.getenv("AWS_REGION", "ap-southeast-2")
QUEUE_URL = os.getenv("SQS_RESEARCH_JOBS_URL")
BUCKET = os.getenv("S3_BUCKET")
DATABASE_URL = os.getenv("DATABASE_URL")

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
    if not DATABASE_URL:
        log("WARN: DATABASE_URL is not set; run status updates will be skipped")
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

def safe_pair(pair: str) -> str:
    return pair.replace("/", "-").replace(":", "-").lower()

def timeframe_to_ms(timeframe: str) -> int:
    if not timeframe:
        return 60 * 60 * 1000
    unit = timeframe[-1]
    value = int(timeframe[:-1] or 1)
    if unit == "m":
        return value * 60 * 1000
    if unit == "h":
        return value * 60 * 60 * 1000
    if unit == "d":
        return value * 24 * 60 * 60 * 1000
    if unit == "w":
        return value * 7 * 24 * 60 * 60 * 1000
    return 60 * 60 * 1000

def download_if_exists(key: str, dest: Path) -> bool:
    if not BUCKET:
        return False
    try:
        with open(dest, "wb") as fh:
            s3.download_fileobj(BUCKET, key, fh)
        log(f"Cached s3://{BUCKET}/{key} -> {dest}")
        return True
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") in {"NoSuchKey", "404"}:
            return False
        raise

def upload_file(path: Path, key: str, content_type: str = "application/octet-stream"):
    if not BUCKET:
        return
    extra = {"ContentType": content_type}
    s3.upload_file(str(path), BUCKET, key, ExtraArgs=extra)
    log(f"Uploaded file s3://{BUCKET}/{key}")

def fetch_ohlcv_year(exchange_id: str, symbol: str, timeframe: str, year: int) -> pd.DataFrame:
    exchange_cls = getattr(ccxt, exchange_id, None)
    if not exchange_cls:
        raise RuntimeError(f"Unsupported exchange: {exchange_id}")
    exchange = exchange_cls({"enableRateLimit": True})
    if not exchange.has.get("fetchOHLCV"):
        raise RuntimeError(f"{exchange_id} does not support fetchOHLCV")

    since = int(pd.Timestamp(year=year, month=1, day=1, tz="UTC").timestamp() * 1000)
    until = int(pd.Timestamp(year=year + 1, month=1, day=1, tz="UTC").timestamp() * 1000)
    timeframe_ms = timeframe_to_ms(timeframe)

    rows: List[List[float]] = []
    cursor = since
    while cursor < until:
        try:
            batch = exchange.fetch_ohlcv(symbol, timeframe=timeframe, since=cursor, limit=500)
        except ccxt.BaseError as exc:
            log(f"fetch_ohlcv error {exc}; sleeping")
            time.sleep(1)
            continue

        if not batch:
            break

        rows.extend(batch)
        next_cursor = batch[-1][0] + timeframe_ms
        if next_cursor <= cursor:
            next_cursor = cursor + timeframe_ms
        cursor = next_cursor
        if exchange.rateLimit:
            time.sleep(exchange.rateLimit / 1000)

    if not rows:
        return pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"])

    df = pd.DataFrame(rows, columns=["timestamp", "open", "high", "low", "close", "volume"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True)
    return df

def ensure_market_data(spec: Dict[str, Any], cache_dir: Path) -> pd.DataFrame:
    exchange_id = (spec.get("exchange") or "binance").lower()
    symbol = spec.get("pair") or "BTC/USDT"
    timeframe = spec.get("timeframe") or "1h"
    start = pd.to_datetime(spec.get("start") or "2022-01-01", utc=True)
    end = pd.to_datetime(spec.get("end") or datetime.utcnow().date(), utc=True)
    if end <= start:
        end = start + pd.Timedelta(days=30)

    years = list(range(start.year, end.year + 1))
    frames: List[pd.DataFrame] = []
    cache_dir.mkdir(parents=True, exist_ok=True)
    pair_slug = safe_pair(symbol)

    for year in years:
        local_path = cache_dir / f"{exchange_id}_{pair_slug}_{timeframe}_{year}.parquet"
        s3_key = f"data/{exchange_id}/{pair_slug}/{timeframe}/{year}.parquet"
        if not local_path.exists():
            downloaded = download_if_exists(s3_key, local_path)
            if not downloaded:
                df_year = fetch_ohlcv_year(exchange_id, symbol, timeframe, year)
                if df_year.empty:
                    continue
                df_year.to_parquet(local_path, index=False)
                upload_file(local_path, s3_key, "application/octet-stream")
        try:
            df = pd.read_parquet(local_path)
        except Exception:
            log(f"Failed to read cache {local_path}, refetching…")
            df = fetch_ohlcv_year(exchange_id, symbol, timeframe, year)
            if df.empty:
                continue
            df.to_parquet(local_path, index=False)
            upload_file(local_path, s3_key, "application/octet-stream")
        df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
        mask = (df["timestamp"] >= start) & (df["timestamp"] <= end)
        frames.append(df.loc[mask])

    if not frames:
        raise RuntimeError("No historical data available")

    merged = pd.concat(frames).drop_duplicates(subset="timestamp").sort_values("timestamp")
    merged = merged.set_index("timestamp")
    return merged

# --------------------------------------------------------------------
# Run store (Postgres)
# --------------------------------------------------------------------
class RunStore:
    def __init__(self, url: Optional[str]):
        self.url = url
        self.conn = None
        if url:
            try:
                self.conn = psycopg.connect(url)
                self.conn.autocommit = True
                log("Connected to Postgres for run status updates")
            except Exception as exc:
                log(f"ERROR: failed to connect to Postgres: {exc}")
                self.conn = None

    def enabled(self) -> bool:
        return self.conn is not None

    def ensure_run(self, job: Dict[str, Any], artifact_prefix: str, kind: str):
        if not self.conn:
            return
        spec = job.get("spec") or {}
        params = job.get("params") or {}
        with self.conn.cursor() as cur:
            cur.execute(
                '''
                INSERT INTO "Run" ("id","strategyId","ownerId","kind","status","artifactPrefix","spec","params")
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT ("id") DO NOTHING
                ''',
                (
                    job.get("runId"),
                    job.get("strategyId"),
                    job.get("ownerId"),
                    kind.upper(),
                    "QUEUED",
                    artifact_prefix,
                    Json(spec),
                    Json(params),
                ),
            )

    def mark_running(self, run_id: str):
        self._execute(
            'UPDATE "Run" SET status=%s, "startedAt"=COALESCE("startedAt", NOW()), "updatedAt"=NOW() WHERE id=%s',
            ("RUNNING", run_id),
        )

    def mark_succeeded(
        self,
        run_id: str,
        kpis: Optional[Dict[str, Any]],
        artifact_prefix: Optional[str],
    ):
        assignments = ['status=%s', '"finishedAt"=NOW()']
        values: List[Any] = ["SUCCEEDED"]
        if kpis is not None:
            assignments.append('"kpis"=%s')
            values.append(Json(kpis))
        if artifact_prefix:
            assignments.append('"artifactPrefix"=%s')
            values.append(artifact_prefix)
        self._update(run_id, assignments, values)

    def mark_failed(self, run_id: str):
        self._update(run_id, ['status=%s', '"finishedAt"=NOW()'], ["FAILED"])

    def _execute(self, query: str, params: tuple):
        if not self.conn:
            return
        with self.conn.cursor() as cur:
            cur.execute(query, params)

    def _update(self, run_id: str, assignments: List[str], values: List[Any]):
        if not self.conn or not assignments:
            return
        set_clause = ", ".join(assignments + ['"updatedAt"=NOW()'])
        with self.conn.cursor() as cur:
            cur.execute(
                f'UPDATE "Run" SET {set_clause} WHERE id=%s',
                (*values, run_id),
            )

    def close(self):
        if self.conn:
            self.conn.close()


def aggregate_kpis(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not rows:
        return {}
    agg: Dict[str, Any] = {}
    for key in ["netReturn", "cagr", "sharpe", "sortino", "winRate", "avgTrade"]:
        values = [
            float(row.get(key))
            for row in rows
            if isinstance(row.get(key), (int, float))
        ]
        if values:
            agg[key] = sum(values) / len(values)
    dd_values = [
        float(row.get("maxDD"))
        for row in rows
        if isinstance(row.get("maxDD"), (int, float))
    ]
    if dd_values:
        agg["maxDD"] = min(dd_values)
    trade_counts = [
        int(row.get("trades"))
        for row in rows
        if isinstance(row.get("trades"), (int, float))
    ]
    if trade_counts:
        agg["trades"] = int(sum(trade_counts))
    return agg

# --------------------------------------------------------------------
# Engine hook (you implement this)
# --------------------------------------------------------------------
def timeframe_to_freq(tf: str) -> str:
    tf = (tf or "1h").lower()
    if tf.endswith("m"):
        return f"{tf[:-1]}T"
    if tf.endswith("h"):
        return f"{tf[:-1]}H"
    if tf.endswith("d"):
        return f"{tf[:-1]}D"
    return "1H"


def timeframe_to_freq(tf: str) -> str:
    if not tf:
        return "1H"
    suffix = tf[-1]
    value = tf[:-1]
    if suffix.lower() == "m":
        return f"{value}T"
    if suffix.lower() == "h":
        return f"{value}H"
    if suffix.lower() == "d":
        return f"{value}D"
    return "1H"


def run_engine(
    strategy_path: Path,
    workdir: Path,
    spec: Dict[str, Any],
    params: Optional[Dict[str, Any]] = None,
    phase: Optional[str] = None,
) -> Dict[str, Any]:
    cache_dir = Path("/tmp/market-data")
    params = params or {}
    market = ensure_market_data(spec or {}, cache_dir)
    close = market["close"]
    freq = timeframe_to_freq(spec.get("timeframe", "1h"))

    rsi_window = int(params.get("rsi_len", 14))
    buy_thresh = float(params.get("rsi_buy", 30))
    sell_thresh = float(params.get("rsi_sell", 70))

    rsi = vbt.RSI.run(close, window=rsi_window)
    entries = rsi.rsi <= buy_thresh
    exits = rsi.rsi >= sell_thresh

    portfolio = vbt.Portfolio.from_signals(
        close,
        entries,
        exits,
        freq=freq,
        init_cash=10_000,
        fees=0.0005,
        slippage=0.0005,
    )

    equity_series = portfolio.value()
    drawdown_series = portfolio.drawdown_series()
    trades_df = portfolio.trades.records_readable.copy()

    artifacts: List[Dict[str, Any]] = []

    equity_path = workdir / "equity.csv"
    pd.DataFrame(
        {"timestamp": equity_series.index, "equity": equity_series.values}
    ).to_csv(equity_path, index=False)
    artifacts.append(
        {"path": str(equity_path), "name": "equity.csv", "content_type": "text/csv"}
    )

    drawdown_path = workdir / "drawdown.csv"
    pd.DataFrame(
        {"timestamp": drawdown_series.index, "drawdown": drawdown_series.values}
    ).to_csv(drawdown_path, index=False)
    artifacts.append(
        {
            "path": str(drawdown_path),
            "name": "drawdown.csv",
            "content_type": "text/csv",
        }
    )

    trades_path = workdir / "trades.csv"
    if not trades_df.empty:
        trades_df = trades_df.rename(
            columns={
                "Entry Timestamp": "entry",
                "Exit Timestamp": "exit",
                "PnL": "pnl",
            }
        )
    trades_df.to_csv(trades_path, index=False)
    artifacts.append(
        {"path": str(trades_path), "name": "trades.csv", "content_type": "text/csv"}
    )

    stats = {
        "netReturn": safe_metric(portfolio.total_return()),
        "cagr": safe_metric(portfolio.cagr()),
        "sharpe": safe_metric(portfolio.sharpe_ratio()),
        "sortino": safe_metric(portfolio.sortino_ratio()),
        "maxDD": safe_metric(portfolio.max_drawdown()),
        "winRate": safe_metric(portfolio.trades.win_rate()),
        "avgTrade": safe_metric(portfolio.trades.pnl.mean()) if portfolio.trades.count() else 0.0,
        "trades": int(portfolio.trades.count()),
    }

    logs_path = workdir / "logs.txt"
    logs_path.write_text(
        "\n".join(
            [
                f"Strategy: {strategy_path.name}",
                f"Phase: {phase or 'backtest'}",
                f"Params: {json.dumps(params, sort_keys=True)}",
                f"Net return: {stats['netReturn']:.2%}",
                f"CAGR: {stats['cagr']:.2%}",
                f"Sharpe: {stats['sharpe']:.2f}",
                f"Trades: {stats['trades']}",
            ]
        )
    )
    artifacts.append(
        {"path": str(logs_path), "name": "logs.txt", "content_type": "text/plain"}
    )

    return {"kpis": stats, "artifacts": artifacts}

# --------------------------------------------------------------------
# Kind handlers
# --------------------------------------------------------------------
def handle_backtest(job: Dict[str, Any], workdir: Path) -> Dict[str, Any]:
    """Run a single backtest and write metrics.json under runs/<runId>/."""
    strategy_file = workdir / "strategy_payload"
    download_strategy(job["manifestS3Key"], strategy_file)

    engine_out = run_engine(
        strategy_file,
        workdir,
        job.get("spec", {}),
        job.get("params"),
    )
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

    result["artifactPrefix"] = job["artifactPrefix"]
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

        engine_out = run_engine(
            strategy_file, subdir, job.get("spec", {}), params
        )
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
    child_kpis = [
        child.get("kpis", {})
        for child in index["children"]
        if child.get("kpis")
    ]
    parent_metrics["kpis"] = aggregate_kpis(child_kpis)
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

        engine_out = run_engine(
            strategy_file, subdir, spec, params, phase="walkforward_test"
        )
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
    window_kpis = [
        window.get("kpis", {})
        for window in idx["windows"]
        if window.get("kpis")
    ]
    parent_metrics["kpis"] = aggregate_kpis(window_kpis)
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

    store = RunStore(DATABASE_URL)

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
            if store.enabled():
                store.ensure_run(job, prefix, kind.upper())
                store.mark_running(run_id)

            if kind == "backtest":
                result = handle_backtest(job, workdir)
            elif kind == "grid":
                result = handle_grid(job, workdir)
            elif kind == "walkforward":
                result = handle_walkforward(job, workdir)
            else:
                raise ValueError(f"Unknown job kind: {kind}")

            if store.enabled():
                store.mark_succeeded(
                    run_id,
                    result.get("kpis"),
                    result.get("artifactPrefix", prefix),
                )

            if receipt:
                sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt)
            log(f"✅ Completed job {run_id} (artifacts under s3://{BUCKET}/{prefix})")

        except Exception as e:
            log(f"❌ Job {run_id} failed: {e}")
            traceback.print_exc()
            if store.enabled():
                store.mark_failed(run_id)
            time.sleep(5)

    log("Exiting worker main loop")
    store.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"FATAL: worker crashed: {e}")
        traceback.print_exc()
        time.sleep(2)
        sys.exit(1)
def safe_metric(value: Any) -> float:
    try:
        num = float(value)
    except Exception:
        return 0.0
    if math.isnan(num) or math.isinf(num):
        return 0.0
    return num
