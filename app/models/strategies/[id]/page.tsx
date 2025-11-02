"use client";

import ASCIIText from "@/components/ASCIIText";
import Link from "next/link";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type KPI = { cagr?: number; sharpe?: number; mdd?: number; trades?: number };
type PastRun = { id: string; status: "SUCCEEDED" | "FAILED" | "RUNNING"; startedAt: string; kpis?: KPI };

// --- Strongly typed params ---
type ParamsState = { rsi_len: number; rsi_buy: number; rsi_sell: number };
const PARAM_KEYS = ["rsi_len", "rsi_buy", "rsi_sell"] as const;
type ParamKey = typeof PARAM_KEYS[number];

export default function StrategyEditorPage() {
    const { status } = useSession();
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const routes = {
        home: "/" as Route,
        models: "/models" as Route,
        runs: "/models/runs" as Route,
        signin: "/api/auth/signin" as Route,
    };

    const strategyId = decodeURIComponent(params.id);
    const [name, setName] = useState(strategyId === "seed" ? "RSI_Band" : strategyId);
    const [code, setCode] = useState<string>(
        `# ${name}
from sandbox.api import Strategy, Indicator, Signal

class ${name.replace(/[^A-Za-z0-9_]/g, "_")}(Strategy):
    params = { "rsi_len": 14, "rsi_buy": 30, "rsi_sell": 70 }
    def build(self, data):
        rsi = Indicator.rsi(data.close, self.p.rsi_len)
        self.buy_signal  = Signal.cross_under(rsi, self.p.rsi_buy)
        self.sell_signal = Signal.cross_over(rsi, self.p.rsi_sell)
`
    );

    const [paramsState, setParamsState] = useState<ParamsState>({ rsi_len: 14, rsi_buy: 30, rsi_sell: 70 });
    const [dataset, setDataset] = useState({ exchange: "binance", pairs: "BTC/USDT,ETH/USDT", timeframe: "1h", from: "2022-01-01", to: "2025-01-01" });
    const [loading, setLoading] = useState(false);
    const [runs, setRuns] = useState<PastRun[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/strategies/${encodeURIComponent(name)}/runs`, { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setRuns(data?.runs ?? []);
                } else {
                    setRuns([{ id: "r_010", status: "SUCCEEDED", startedAt: "2025-01-09T10:00:00Z", kpis: { cagr: 0.37, mdd: -0.21, sharpe: 1.2, trades: 322 } }]);
                }
            } catch {
                /* ignore */
            }
        };
        load();
    }, [name]);

    const save = useCallback(async () => {
        setLoading(true);
        try {
            await fetch("/api/strategies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, code }),
            });
            if (strategyId === "seed") {
                // Use UrlObject to satisfy typed routes
                router.replace({
                    pathname: "/models/strategies/[id]",
                    query: { id: name },
                });
            }
        } finally {
            setLoading(false);
        }
    }, [name, code, router, strategyId]);

    const launch = useCallback(
        async (kind: "backtest" | "grid" | "walkforward") => {
            setLoading(true);
            try {
                const payload = { strategy: name, params: paramsState, dataset };
                const endpoint =
                    kind === "backtest" ? "/api/jobs/backtest" : kind === "grid" ? "/api/jobs/grid" : "/api/jobs/walkforward";
                const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                const { jobId } = res.ok ? await res.json() : { jobId: undefined };

                // Use UrlObject; add ?focus=... only when present
                router.push({
                    pathname: routes.runs,
                    ...(jobId ? { query: { focus: jobId } } : {}),
                });
            } finally {
                setLoading(false);
            }
        },
        [name, paramsState, dataset, router, routes.runs]
    );

    const canSave = useMemo(() => name.trim().length > 0 && code.trim().length > 0, [name, code]);

    return (
        <main
            style={{
                minHeight: "100svh",
                width: "100%",
                display: "grid",
                placeItems: "center",
                padding: "2rem",
                textAlign: "center",
            }}
        >
            <section style={{ display: "grid", gap: "1.25rem", width: "min(1200px, 96vw)" }}>
                <div style={{ width: "min(90vw, 700px)", height: "clamp(80px, 20vw, 200px)", position: "relative", margin: "0 auto" }}>
                    <ASCIIText text="Strategy" enableWaves interactive={false} />
                </div>

                {status === "loading" && <p>Checking access…</p>}

                {status === "unauthenticated" && (
                    <>
                        <p>You must sign in to edit strategies.</p>
                        <Link
                            href={routes.signin}
                            style={{
                                padding: "0.6rem 1.2rem",
                                borderRadius: "6px",
                                fontWeight: 600,
                                border: "2px solid currentColor",
                                textDecoration: "none",
                            }}
                        >
                            Sign In
                        </Link>
                    </>
                )}

                {status === "authenticated" && (
                    <>
                        {/* Top controls */}
                        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Strategy name"
                                style={{
                                    padding: "0.55rem 0.8rem",
                                    border: "1px solid rgba(0,0,0,.2)",
                                    borderRadius: 8,
                                    width: 240,
                                    fontWeight: 600,
                                }}
                            />
                            <button
                                onClick={save}
                                disabled={!canSave || loading}
                                style={{
                                    padding: "0.55rem 0.9rem",
                                    borderRadius: 8,
                                    border: "none",
                                    background: "black",
                                    color: "white",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    opacity: !canSave || loading ? 0.6 : 1,
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={() => launch("backtest")}
                                disabled={loading}
                                style={{
                                    padding: "0.55rem 0.9rem",
                                    borderRadius: 8,
                                    border: "1px solid rgba(0,0,0,.18)",
                                    background: "white",
                                    cursor: "pointer",
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                Run Backtest
                            </button>
                            <button
                                onClick={() => launch("grid")}
                                disabled={loading}
                                style={{
                                    padding: "0.55rem 0.9rem",
                                    borderRadius: 8,
                                    border: "1px solid rgba(0,0,0,.18)",
                                    background: "white",
                                    cursor: "pointer",
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                Grid Search
                            </button>
                            <button
                                onClick={() => launch("walkforward")}
                                disabled={loading}
                                style={{
                                    padding: "0.55rem 0.9rem",
                                    borderRadius: 8,
                                    border: "1px solid rgba(0,0,0,.18)",
                                    background: "white",
                                    cursor: "pointer",
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                Walk-Forward
                            </button>
                        </div>

                        {/* Editor + Right panel */}
                        <div
                            style={{
                                display: "grid",
                                gap: "1rem",
                                gridTemplateColumns: "1fr 1fr",
                                alignItems: "start",
                            }}
                        >
                            {/* Editor */}
                            <div
                                style={{
                                    border: "1px solid rgba(0,0,0,.12)",
                                    borderRadius: 10,
                                    overflow: "hidden",
                                    background: "white",
                                }}
                            >
                                <div style={{ textAlign: "right", padding: "6px 10px", fontSize: 12, background: "rgba(0,0,0,.04)" }}>
                                    Python API
                                </div>
                                <textarea
                                    spellCheck={false}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    style={{
                                        height: 520,
                                        width: "100%",
                                        resize: "none",
                                        border: "none",
                                        outline: "none",
                                        padding: 12,
                                        fontFamily:
                                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                                        fontSize: 13,
                                        background: "#0b1020",
                                        color: "white",
                                    }}
                                />
                            </div>

                            {/* Parameters / Dataset / Runs */}
                            <div style={{ display: "grid", gap: "1rem" }}>
                                {/* Params */}
                                <div style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 10, padding: "1rem", background: "white" }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Parameters</div>
                                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)" }}>
                                        {PARAM_KEYS.map((k: ParamKey) => (
                                            <div key={k} style={{ textAlign: "left" }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{k}</div>
                                                <input
                                                    type="number"
                                                    value={paramsState[k]}
                                                    onChange={(e) =>
                                                        setParamsState((p) => ({ ...p, [k]: Number(e.target.value) } as ParamsState))
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        padding: "0.45rem 0.6rem",
                                                        border: "1px solid rgba(0,0,0,.2)",
                                                        borderRadius: 8,
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Dataset */}
                                <div style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 10, padding: "1rem", background: "white" }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Dataset</div>
                                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, 1fr)" }}>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Exchange</div>
                                            <select
                                                value={dataset.exchange}
                                                onChange={(e) => setDataset((d) => ({ ...d, exchange: e.target.value }))}
                                                style={{ width: "100%", padding: "0.45rem 0.6rem", border: "1px solid rgba(0,0,0,.2)", borderRadius: 8 }}
                                            >
                                                <option value="binance">Binance</option>
                                                <option value="okx">OKX</option>
                                                <option value="bybit">Bybit</option>
                                            </select>
                                        </div>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Timeframe</div>
                                            <select
                                                value={dataset.timeframe}
                                                onChange={(e) => setDataset((d) => ({ ...d, timeframe: e.target.value }))}
                                                style={{ width: "100%", padding: "0.45rem 0.6rem", border: "1px solid rgba(0,0,0,.2)", borderRadius: 8 }}
                                            >
                                                {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
                                                    <option key={tf} value={tf}>
                                                        {tf}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ gridColumn: "1 / -1", textAlign: "left" }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Pairs (comma separated)</div>
                                            <input
                                                value={dataset.pairs}
                                                onChange={(e) => setDataset((d) => ({ ...d, pairs: e.target.value }))}
                                                style={{ width: "100%", padding: "0.45rem 0.6rem", border: "1px solid rgba(0,0,0,.2)", borderRadius: 8 }}
                                            />
                                        </div>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>From</div>
                                            <input
                                                type="date"
                                                value={dataset.from}
                                                onChange={(e) => setDataset((d) => ({ ...d, from: e.target.value }))}
                                                style={{ width: "100%", padding: "0.45rem 0.6rem", border: "1px solid rgba(0,0,0,.2)", borderRadius: 8 }}
                                            />
                                        </div>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>To</div>
                                            <input
                                                type="date"
                                                value={dataset.to}
                                                onChange={(e) => setDataset((d) => ({ ...d, to: e.target.value }))}
                                                style={{ width: "100%", padding: "0.45rem 0.6rem", border: "1px solid rgba(0,0,0,.2)", borderRadius: 8 }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Runs */}
                                <div style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 10, padding: "1rem", background: "white" }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent Runs</div>
                                    <div style={{ display: "grid", gap: 10, textAlign: "left" }}>
                                        {runs.map((r) => (
                                            <div key={r.id} style={{ display: "flex", justifyContent: "space-between" }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{r.id}</div>
                                                    <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(r.startedAt).toLocaleString()}</div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            display: "inline-block",
                                                            padding: "2px 8px",
                                                            borderRadius: 999,
                                                            background:
                                                                r.status === "SUCCEEDED"
                                                                    ? "rgba(16,185,129,.15)"
                                                                    : r.status === "FAILED"
                                                                        ? "rgba(239,68,68,.15)"
                                                                        : "rgba(59,130,246,.15)",
                                                        }}
                                                    >
                                                        {r.status}
                                                    </div>
                                                    {r.kpis && (
                                                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                                                            {r.kpis.cagr != null ? `CAGR ${(r.kpis.cagr * 100).toFixed(1)}%` : ""}
                                                            {r.kpis.sharpe != null ? ` · Sharpe ${r.kpis.sharpe.toFixed(2)}` : ""}
                                                            {r.kpis.mdd != null ? ` · MDD ${(r.kpis.mdd * 100).toFixed(1)}%` : ""}
                                                            {r.kpis.trades != null ? ` · Trades ${r.kpis.trades}` : ""}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {!runs.length && <div style={{ opacity: 0.7 }}>No runs yet.</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6 }}>
                    <Link href={routes.models} style={{ opacity: 0.7, textDecoration: "none" }}>
                        ← Back to models
                    </Link>
                    <Link href={routes.home} style={{ opacity: 0.7, textDecoration: "none" }}>
                        ← Back to home
                    </Link>
                </div>
            </section>
        </main>
    );
}