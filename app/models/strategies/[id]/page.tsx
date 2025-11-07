"use client";

import ASCIIText from "@/components/ASCIIText";
import Link from "next/link";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

const API = "/api/models";

type KPI = { cagr?: number; sharpe?: number; mdd?: number; trades?: number };
type PastRun = { id: string; status: "SUCCEEDED" | "FAILED" | "RUNNING"; startedAt: string; kpis?: KPI };
type ParamsState = { rsi_len: number; rsi_buy: number; rsi_sell: number };
const PARAM_KEYS = ["rsi_len", "rsi_buy", "rsi_sell"] as const;
type ParamKey = typeof PARAM_KEYS[number];

export default function StrategyEditorPage() {
    const { status } = useSession();
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const routes = { home: "/" as Route, models: "/models" as Route, signin: "/api/auth/signin" as Route };

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
        (async () => {
            try {
                const res = await fetch(`${API}/strategies/${encodeURIComponent(name)}/runs`, { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setRuns(data?.runs ?? []);
                } else {
                    setRuns([]);
                }
            } catch {
                setRuns([]);
            }
        })();
    }, [name]);

    const save = useCallback(async () => {
        setLoading(true);
        try {
            await fetch(`${API}/strategies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, code }) });
            if (strategyId === "seed") {
                router.replace(`/models/strategies/${encodeURIComponent(name)}`);
            }
        } finally { setLoading(false); }
    }, [name, code, router, strategyId]);

    const launch = useCallback(async (kind: "backtest" | "grid" | "walkforward") => {
        setLoading(true);
        try {
            const payload = { strategy: name, params: paramsState, dataset };
            const endpoint = kind === "backtest" ? `${API}/jobs/backtest`
                : kind === "grid" ? `${API}/jobs/grid`
                    : `${API}/jobs/walkforward`;
            const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const { jobId } = res.ok ? await res.json() : { jobId: undefined };
            const href = jobId ? `/models/runs?focus=${encodeURIComponent(String(jobId))}` : "/models/runs";
            router.push(href);
        } finally { setLoading(false); }
    }, [name, paramsState, dataset, router]);

    const canSave = useMemo(() => name.trim().length > 0 && code.trim().length > 0, [name, code]);

    const control: React.CSSProperties = {
        width: "100%",
        padding: "0.6rem 0.75rem",
        border: "1px solid rgba(0,0,0,.28)",
        borderRadius: 10,
        background: "#fff",
        color: "#111",
        lineHeight: 1.2,
        minHeight: 40,
    };
    const panel: React.CSSProperties = {
        border: "1px solid rgba(0,0,0,.12)",
        borderRadius: 12,
        background: "#fff",
        color: "#111",
        boxShadow: "0 2px 10px rgba(0,0,0,.12)",
    };
    const chip: React.CSSProperties = {
        fontSize: 12, fontWeight: 800, display: "inline-block", padding: "3px 10px", borderRadius: 999, background: "rgba(0,0,0,.06)", color: "#111",
    };

    return (
        <main style={{ minHeight: "100svh", width: "100%", display: "grid", placeItems: "center", padding: "2rem", textAlign: "center", background: "#111213", color: "#f4f4f5" }}>
            <section style={{ display: "grid", gap: "1.25rem", width: "min(1200px, 96vw)" }}>
                <div style={{ width: "min(90vw, 700px)", height: "clamp(80px, 20vw, 200px)", position: "relative", margin: "0 auto" }}>
                    <ASCIIText text="Strategy" enableWaves interactive={false} />
                </div>

                {status === "loading" && <p>Checking access…</p>}

                {status === "unauthenticated" && (
                    <>
                        <p>You must sign in to edit strategies.</p>
                        <Link href={routes.signin} style={{ padding: "0.7rem 1.2rem", borderRadius: 10, fontWeight: 800, textDecoration: "none", background: "#fff", color: "#111", boxShadow: "0 2px 10px rgba(0,0,0,.18)" }}>
                            Sign In
                        </Link>
                    </>
                )}

                {status === "authenticated" && (
                    <>
                        {/* Top controls */}
                        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Strategy name" style={{ ...control, maxWidth: 260, fontWeight: 700 }} />
                            <button
                                onClick={save}
                                disabled={!canSave || loading}
                                style={{ padding: "0.65rem 1rem", borderRadius: 10, border: "none", background: "#fff", color: "#111", fontWeight: 900, cursor: "pointer", minHeight: 40, opacity: !canSave || loading ? 0.6 : 1, boxShadow: "0 2px 10px rgba(0,0,0,.18)" }}
                            >
                                Save
                            </button>
                            {(["backtest", "grid", "walkforward"] as const).map(k => (
                                <button key={k}
                                    onClick={() => launch(k)}
                                    disabled={loading}
                                    style={{ padding: "0.65rem 1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,.4)", background: "transparent", color: "#fff", cursor: "pointer", minHeight: 40, opacity: loading ? 0.6 : 1 }}
                                >
                                    {k === "backtest" ? "Run Backtest" : k === "grid" ? "Grid Search" : "Walk-Forward"}
                                </button>
                            ))}
                        </div>

                        {/* Editor + Right panel */}
                        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
                            <div style={{ ...panel, overflow: "hidden" }}>
                                <div style={{ textAlign: "right", padding: "6px 10px", ...chip, background: "rgba(0,0,0,.08)" }}>Python API</div>
                                <textarea
                                    spellCheck={false}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    style={{
                                        height: 520, width: "100%", resize: "none", border: "none", outline: "none", padding: 12,
                                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                                        fontSize: 13, background: "#0b1020", color: "#f7fafc",
                                    }}
                                />
                            </div>

                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div style={{ ...panel, padding: "1rem" }}>
                                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Parameters</div>
                                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)" }}>
                                        {PARAM_KEYS.map((k: ParamKey) => (
                                            <div key={k} style={{ textAlign: "left" }}>
                                                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{k}</div>
                                                <input type="number" value={paramsState[k]} onChange={(e) => setParamsState((p) => ({ ...p, [k]: Number(e.target.value) } as ParamsState))} style={control} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ ...panel, padding: "1rem" }}>
                                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Dataset</div>
                                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, 1fr)" }}>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Exchange</div>
                                            <select value={dataset.exchange} onChange={(e) => setDataset((d) => ({ ...d, exchange: e.target.value }))} style={{ ...control, appearance: "auto" as React.CSSProperties["appearance"] }}>
                                                <option value="binance">Binance</option>
                                                <option value="okx">OKX</option>
                                                <option value="bybit">Bybit</option>
                                            </select>
                                        </div>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Timeframe</div>
                                            <select value={dataset.timeframe} onChange={(e) => setDataset((d) => ({ ...d, timeframe: e.target.value }))} style={{ ...control, appearance: "auto" as React.CSSProperties["appearance"] }}>
                                                {["1m", "5m", "15m", "1h", "4h", "1d"].map(tf => <option key={tf} value={tf}>{tf}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ gridColumn: "1 / -1", textAlign: "left" }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Pairs (comma separated)</div>
                                            <input value={dataset.pairs} onChange={(e) => setDataset((d) => ({ ...d, pairs: e.target.value }))} placeholder="e.g. BTC/USDT,ETH/USDT" style={control} />
                                        </div>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>From</div>
                                            <input type="date" value={dataset.from} onChange={(e) => setDataset((d) => ({ ...d, from: e.target.value }))} style={control} />
                                        </div>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>To</div>
                                            <input type="date" value={dataset.to} onChange={(e) => setDataset((d) => ({ ...d, to: e.target.value }))} style={control} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ ...panel, padding: "1rem" }}>
                                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Recent Runs</div>
                                    <div style={{ display: "grid", gap: 10, textAlign: "left" }}>
                                        {runs.map((r) => (
                                            <div key={r.id} style={{ display: "flex", justifyContent: "space-between" }}>
                                                <div>
                                                    <div style={{ fontWeight: 800 }}>{r.id}</div>
                                                    <div style={{ fontSize: 12, opacity: 0.8 }}>{new Date(r.startedAt).toLocaleString()}</div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ ...chip, background: r.status === "SUCCEEDED" ? "rgba(16,185,129,.2)" : r.status === "FAILED" ? "rgba(239,68,68,.25)" : "rgba(59,130,246,.25)" }}>
                                                        {r.status}
                                                    </div>
                                                    {r.kpis && (
                                                        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
                                                            {r.kpis.cagr != null ? `CAGR ${(r.kpis.cagr * 100).toFixed(1)}%` : ""}
                                                            {r.kpis.sharpe != null ? ` · Sharpe ${r.kpis.sharpe.toFixed(2)}` : ""}
                                                            {r.kpis.mdd != null ? ` · MDD ${(r.kpis.mdd * 100).toFixed(1)}%` : ""}
                                                            {r.kpis.trades != null ? ` · Trades ${r.kpis.trades}` : ""}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {!runs.length && <div style={{ opacity: 0.85 }}>No runs yet.</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6 }}>
                    <Link href={routes.models} style={{ opacity: 0.9, textDecoration: "none", color: "#e5e7eb" }}>← Back to models</Link>
                    <Link href={routes.home} style={{ opacity: 0.9, textDecoration: "none", color: "#e5e7eb" }}>← Back to home</Link>
                </div>
            </section>
        </main>
    );
}
