import os
import ast
import json
import time
import uuid
import signal
import sys
import math
import shutil
import subprocess
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Iterable, Tuple

import boto3
import ccxt
import numpy as np
import pandas as pd
import psycopg
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


def safe_metric(value: Any) -> float:
    try:
        num = float(value)
    except Exception:
        return 0.0
    if math.isnan(num) or math.isinf(num):
        return 0.0
    return num

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


def manifest_key_from_strategy(main_key: Optional[str]) -> Optional[str]:
    if not main_key or "/" not in main_key:
        return None
    prefix = main_key.rsplit("/", 1)[0]
    return f"{prefix}/manifest.json"


def load_strategy_manifest(main_key: Optional[str]) -> Dict[str, Any]:
    manifest_key = manifest_key_from_strategy(main_key)
    if not manifest_key or not BUCKET:
        return {}
    try:
        obj = s3.get_object(Bucket=BUCKET, Key=manifest_key)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code in {"NoSuchKey", "404"}:
            return {}
        raise
    try:
        return json.loads(obj["Body"].read().decode("utf-8"))
    except Exception as exc:
        log(f"WARN: failed to parse manifest {manifest_key}: {exc}")
        return {}


def extract_strategy_class(strategy_file: Path, manifest: Optional[Dict[str, Any]] = None) -> str:
    if manifest:
        freqtrade_cfg = manifest.get("freqtrade")
        if isinstance(freqtrade_cfg, dict):
            configured = freqtrade_cfg.get("strategyClass")
            if isinstance(configured, str) and configured.strip():
                return configured.strip()

    try:
        tree = ast.parse(strategy_file.read_text())
        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                for base in node.bases:
                    name = getattr(base, "id", None) or getattr(base, "attr", None)
                    if name == "IStrategy":
                        return node.name
        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                return node.name
    except Exception as exc:
        log(f"WARN: unable to infer strategy class from {strategy_file}: {exc}")
    return "IStrategy"


def prepare_freqtrade_workspace(workdir: Path) -> Dict[str, Path]:
    root = workdir / "freqtrade"
    user_data = root / "user_data"
    strategies = user_data / "strategies"
    data_dir = user_data / "data"
    results = user_data / "backtest_results"
    for path in [root, user_data, strategies, data_dir, results]:
        path.mkdir(parents=True, exist_ok=True)
    return {
        "root": root,
        "user_data": user_data,
        "strategies": strategies,
        "data_dir": data_dir,
        "results": results,
    }


def write_freqtrade_dataset(
    market: pd.DataFrame,
    data_dir: Path,
    exchange: str,
    pair: str,
    timeframe: str,
) -> Path:
    exchange_dir = data_dir / exchange.lower()
    exchange_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{pair.replace('/', '_')}-{timeframe}.json"
    dataset_path = exchange_dir / filename
    records = []
    for ts, row in market.iterrows():
        records.append(
            {
                "date": pd.Timestamp(ts).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
                "volume": float(row["volume"]),
            }
        )
    dataset_path.write_text(json.dumps(records))
    return dataset_path


def timerange_from_spec(spec: Dict[str, Any]) -> Tuple[str, pd.Timestamp, pd.Timestamp]:
    start = pd.to_datetime(spec.get("start"), utc=True, errors="coerce")
    end = pd.to_datetime(spec.get("end"), utc=True, errors="coerce")
    if pd.isna(start):
        start = pd.Timestamp.utcnow().tz_localize("UTC") - pd.Timedelta(days=90)
    if pd.isna(end) or end <= start:
        end = start + pd.Timedelta(days=90)
    timerange = f"{start.strftime('%Y%m%d')}-{end.strftime('%Y%m%d')}"
    return timerange, start, end


def resolve_trades_file(candidate: Path, results_dir: Path) -> Path:
    options = [candidate]
    if candidate.suffix != ".json":
        options.append(candidate.with_suffix(".json"))
    options.append(results_dir / candidate.name)
    if candidate.suffix != ".json":
        options.append(results_dir / f"{candidate.name}.json")
    for path in options:
        if path.exists():
            return path
    candidates = sorted(results_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    if candidates:
        return candidates[0]
    raise FileNotFoundError(f"Unable to locate freqtrade trades export near {candidate}")


def parse_trade_timestamp(value: Any) -> Optional[pd.Timestamp]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        unit = "s"
        if value > 1e12:
            unit = "ms"
        return pd.to_datetime(value, unit=unit, utc=True, errors="coerce")
    if isinstance(value, str):
        return pd.to_datetime(value, utc=True, errors="coerce")
    return None


def normalize_trades(raw_trades: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for record in raw_trades:
        profit = record.get("profit_ratio")
        if profit is None:
            pct = record.get("profit_pct")
            if isinstance(pct, (int, float)):
                profit = float(pct) / 100.0
        if profit is None:
            continue
        close_ts = parse_trade_timestamp(
            record.get("close_timestamp") or record.get("close_time") or record.get("close_date")
        )
        if close_ts is None:
            continue
        open_ts = parse_trade_timestamp(
            record.get("open_timestamp") or record.get("open_time") or record.get("open_date")
        )
        normalized.append(
            {
                "pair": record.get("pair") or "",
                "open_time": open_ts,
                "close_time": close_ts,
                "profit_ratio": float(profit),
                "profit_abs": safe_metric(record.get("profit_abs") or record.get("profit_amount")),
                "duration": record.get("trade_duration") or record.get("duration") or record.get("duration_min"),
            }
        )
    normalized.sort(key=lambda t: t["close_time"])
    return normalized


def load_trades(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text())
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            if isinstance(data.get("trades"), list):
                return data["trades"]
            if isinstance(data.get("results"), list):
                return data["results"]
    except json.JSONDecodeError:
        pass
    try:
        df = pd.read_csv(path)
        return df.to_dict("records")
    except Exception:
        return []


def build_equity_series(
    trades: List[Dict[str, Any]],
    initial_cash: float,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    equity = initial_cash
    peak = initial_cash
    equity_rows: List[Dict[str, Any]] = []
    drawdown_rows: List[Dict[str, Any]] = []
    for trade in trades:
        equity *= 1 + float(trade["profit_ratio"])
        if equity > peak:
            peak = equity
        dd = (equity / peak) - 1
        timestamp = trade["close_time"].isoformat()
        equity_rows.append({"timestamp": timestamp, "equity": equity})
        drawdown_rows.append({"timestamp": timestamp, "drawdown": dd})
    return equity_rows, drawdown_rows


def compute_kpis(
    trades: List[Dict[str, Any]],
    equity_rows: List[Dict[str, Any]],
    drawdown_rows: List[Dict[str, Any]],
    period: Tuple[pd.Timestamp, pd.Timestamp],
    initial_cash: float,
) -> Dict[str, Any]:
    start, end = period
    returns = [float(trade["profit_ratio"]) for trade in trades]
    net_return = (
        equity_rows[-1]["equity"] / initial_cash - 1 if equity_rows else 0.0
    )
    duration_days = max((end - start).total_seconds() / 86400.0, 1)
    years = duration_days / 365.25
    growth_base = 1 + net_return
    if growth_base <= 0 or years <= 0:
        cagr = net_return
    else:
        cagr = growth_base ** (1 / years) - 1
    sharpe = 0.0
    sortino = 0.0
    if returns:
        mean_ret = float(np.mean(returns))
        std_ret = float(np.std(returns))
        downside = [r for r in returns if r < 0]
        sharpe = (mean_ret / std_ret) * math.sqrt(len(returns)) if std_ret > 0 else 0.0
        downside_std = float(np.std(downside)) if downside else 0.0
        sortino = (mean_ret / downside_std) * math.sqrt(len(returns)) if downside_std > 0 else 0.0
    max_dd = min((row["drawdown"] for row in drawdown_rows), default=0.0)
    win_rate = (
        sum(1 for r in returns if r > 0) / len(returns) if returns else 0.0
    )
    avg_trade = float(np.mean(returns)) if returns else 0.0
    return {
        "netReturn": safe_metric(net_return),
        "cagr": safe_metric(cagr),
        "sharpe": safe_metric(sharpe),
        "sortino": safe_metric(sortino),
        "maxDD": safe_metric(max_dd),
        "winRate": safe_metric(win_rate),
        "avgTrade": safe_metric(avg_trade),
        "trades": len(returns),
    }


def run_freqtrade_process(
    config: Dict[str, Any],
    workspace: Dict[str, Path],
    timerange: str,
    strategy_class: str,
) -> Tuple[Path, Path]:
    config_path = workspace["root"] / "freqtrade-config.json"
    dumpable = {}
    for key, value in config.items():
        if isinstance(value, Path):
            dumpable[key] = str(value)
        else:
            dumpable[key] = value
    config_path.write_text(json.dumps(dumpable, indent=2))

    freqtrade_bin = os.getenv("FREQTRADE_BIN", "freqtrade")
    export_name = f"{strategy_class.replace(' ', '_')}_trades.json"
    export_path = workspace["results"] / export_name

    env = os.environ.copy()
    env["FREQTRADE_USERDIR"] = str(workspace["user_data"])

    cmd = [
        freqtrade_bin,
        "backtesting",
        "--config",
        str(config_path),
        "--timerange",
        timerange,
        "--strategy",
        strategy_class,
        "--export",
        "trades",
        "--export-filename",
        str(export_path),
    ]

    log(f"Executing freqtrade: {' '.join(cmd)}")
    proc = subprocess.run(
        cmd,
        cwd=workspace["root"],
        capture_output=True,
        text=True,
        env=env,
    )
    logs_path = workspace["root"] / "logs.txt"
    logs_path.write_text(
        "\n".join(
            [
                f"$ {' '.join(cmd)}",
                "",
                proc.stdout.strip(),
                "",
                proc.stderr.strip(),
            ]
        ).strip()
    )
    if proc.returncode != 0:
        raise RuntimeError(f"freqtrade exited with {proc.returncode}")

    trades_path = resolve_trades_file(export_path, workspace["results"])
    return trades_path, logs_path

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
    manifest: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    cache_dir = Path("/tmp/market-data")
    params = params or {}
    manifest = manifest or {}

    exchange = (spec.get("exchange") or "binance").lower()
    pair = spec.get("pair") or "BTC/USDT"
    timeframe = spec.get("timeframe") or "1h"

    market = ensure_market_data(spec or {}, cache_dir)
    workspace = prepare_freqtrade_workspace(workdir)
    timerange, start_dt, end_dt = timerange_from_spec(spec or {})

    strategy_dest = workspace["strategies"] / strategy_path.name
    shutil.copy(strategy_path, strategy_dest)

    write_freqtrade_dataset(market, workspace["data_dir"], exchange, pair, timeframe)

    freqtrade_cfg = manifest.get("freqtrade", {}) if isinstance(manifest, dict) else {}
    stake_currency = (
        freqtrade_cfg.get("stakeCurrency")
        if isinstance(freqtrade_cfg, dict)
        else None
    ) or (pair.split("/")[-1] if "/" in pair else "USDT")
    stake_amount = (
        float(freqtrade_cfg.get("stakeAmount", 1000))
        if isinstance(freqtrade_cfg, dict)
        else 1000.0
    )
    startup_count = (
        int(freqtrade_cfg.get("startupCandleCount", 50))
        if isinstance(freqtrade_cfg, dict)
        else 50
    )
    initial_cash = safe_metric(freqtrade_cfg.get("wallet", 10_000)) or 10_000.0

    strategy_class = extract_strategy_class(strategy_dest, manifest)
    config = {
        "dry_run": True,
        "dry_run_wallet": initial_cash,
        "strategy": strategy_class,
        "strategy_path": str(workspace["strategies"]),
        "datadir": str(workspace["data_dir"]),
        "dataformat_ohlcv": "json",
        "dataformat_trades": "json",
        "timeframe": timeframe,
        "startup_candle_count": startup_count,
        "max_open_trades": 5,
        "stake_currency": stake_currency,
        "stake_amount": stake_amount,
        "model_params": params,
        "exchange": {
            "name": exchange,
            "pair_whitelist": [pair],
            "ccxt_config": {"enableRateLimit": True},
        },
        "pairlists": [{"method": "StaticPairList", "pairs": [pair]}],
    }

    trades_path, logs_path = run_freqtrade_process(
        config,
        workspace,
        timerange,
        strategy_class,
    )
    raw_trades = load_trades(trades_path)
    trades = normalize_trades(raw_trades)
    equity_rows, drawdown_rows = build_equity_series(trades, initial_cash)
    kpis = compute_kpis(trades, equity_rows, drawdown_rows, (start_dt, end_dt), initial_cash)

    equity_path = workdir / "equity.csv"
    pd.DataFrame(equity_rows).to_csv(equity_path, index=False)
    drawdown_path = workdir / "drawdown.csv"
    pd.DataFrame(drawdown_rows).to_csv(drawdown_path, index=False)
    trades_path_csv = workdir / "trades.csv"
    trades_df = pd.DataFrame(
        [
            {
                "pair": t["pair"],
                "open_time": t["open_time"].isoformat() if t["open_time"] else None,
                "close_time": t["close_time"].isoformat(),
                "profit_ratio": t["profit_ratio"],
                "profit_abs": t["profit_abs"],
                "duration": t["duration"],
            }
            for t in trades
        ]
    )
    trades_df.to_csv(trades_path_csv, index=False)

    summary = "\n".join(
        [
            f"Strategy: {strategy_class}",
            f"Phase: {phase or 'backtest'}",
            f"Timerange: {timerange}",
            f"Params: {json.dumps(params, sort_keys=True)}",
            f"Net return: {kpis['netReturn']:.2%}",
            f"CAGR: {kpis['cagr']:.2%}",
            f"Sharpe: {kpis['sharpe']:.2f}",
            f"Trades: {kpis['trades']}",
        ]
    )
    with open(logs_path, "a", encoding="utf-8") as fh:
        fh.write("\n\n" + summary + "\n")

    artifacts = [
        {"path": str(equity_path), "name": "equity.csv", "content_type": "text/csv"},
        {"path": str(drawdown_path), "name": "drawdown.csv", "content_type": "text/csv"},
        {"path": str(trades_path_csv), "name": "trades.csv", "content_type": "text/csv"},
        {"path": str(logs_path), "name": "logs.txt", "content_type": "text/plain"},
    ]

    return {"kpis": kpis, "artifacts": artifacts}

# --------------------------------------------------------------------
# Kind handlers
# --------------------------------------------------------------------
def handle_backtest(job: Dict[str, Any], workdir: Path) -> Dict[str, Any]:
    """Run a single backtest and write metrics.json under runs/<runId>/."""
    strategy_file = workdir / "strategy_payload"
    download_strategy(job["manifestS3Key"], strategy_file)
    manifest = load_strategy_manifest(job.get("manifestS3Key"))
    manifest = load_strategy_manifest(job.get("manifestS3Key"))
    manifest = load_strategy_manifest(job.get("manifestS3Key"))

    engine_out = run_engine(
        strategy_file,
        workdir,
        job.get("spec", {}),
        job.get("params"),
        manifest=manifest,
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
            strategy_file, subdir, job.get("spec", {}), params, manifest=manifest
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
            strategy_file,
            subdir,
            spec,
            params,
            phase="walkforward_test",
            manifest=manifest,
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
