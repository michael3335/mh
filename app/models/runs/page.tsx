"use client";

import ASCIIText from "@/components/ASCIIText";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Run = {
    id: string;
    strategyName: string;
    kind: "backtest" | "grid" | "walkforward";
    status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
    startedAt: string;
    finishedAt?: string | null;
    kpis?: { cagr?: number; mdd?: number; sharpe?: number; trades?: number };
};

export default function RunsPage() {
    const { status } = useSession();
    const routes = {
        home: "/" as Route,
        signin: "/api/auth/signin" as Route,
    };

    const [runs, setRuns] = useState<Run[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let abort = false;
        const load = async () => {
            try {
                const res = await fetch("/api/runs", { cache: "no-store" });
                if (!abort && res.ok) {
                    const data = await res.json();
                    setRuns(data?.runs ?? []);
                } else if (!abort) {
                    // Mock so the page has structure before the API exists
                    setRuns([
                        {
                            id: "r_001",
                            strategyName: "RSI_Band",
                            kind: "backtest",
                            status: "SUCCEEDED",
                            startedAt: "2025-01-10T12:10:00Z",
                            finishedAt: "2025-01-10T12:12:20Z",
                            kpis: { cagr: 0.41, mdd: -0.23, sharpe: 1.3, trades: 812 },
                        },
                        {
                            id: "r_002",
                            strategyName: "Breakout_v2",
                            kind: "grid",
                            status: "RUNNING",
                            startedAt: "2025-01-10T13:00:00Z",
                        },
                    ]);
                }
            } catch {
                /* ignore */
            } finally {
                if (!abort) setLoading(false);
            }
        };
        load();
        return () => {
            abort = true;
        };
    }, []);

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
            <section style={{ display: "grid", gap: "1.5rem", width: "min(100%, 920px)" }}>
                <div style={{ width: "min(90vw, 700px)", height: "clamp(80px, 20vw, 200px)", position: "relative", margin: "0 auto" }}>
                    <ASCIIText text="Runs" enableWaves interactive={false} />
                </div>

                {status === "loading" && <p>Checking access…</p>}

                {status === "unauthenticated" && (
                    <>
                        <p>You must sign in to view runs.</p>
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
                    <div
                        style={{
                            background: "white",
                            border: "1px solid rgba(0,0,0,.12)",
                            borderRadius: 10,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
                                gap: "0.5rem",
                                padding: "0.75rem 1rem",
                                background: "rgba(0,0,0,.04)",
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: ".04em",
                            }}
                        >
                            <div>Run / Time</div>
                            <div>Strategy</div>
                            <div>Type</div>
                            <div>Status / KPIs</div>
                        </div>

                        <div>
                            {loading && <div style={{ padding: "1rem" }}>Loading…</div>}
                            {!loading &&
                                runs.map((r) => (
                                    <div
                                        key={r.id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
                                            gap: "0.5rem",
                                            padding: "0.9rem 1rem",
                                            borderTop: "1px solid rgba(0,0,0,.06)",
                                            textAlign: "left",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{r.id}</div>
                                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                                                {new Date(r.startedAt).toLocaleString()}
                                                {r.finishedAt ? ` → ${new Date(r.finishedAt).toLocaleTimeString()}` : ""}
                                            </div>
                                        </div>
                                        <div style={{ alignSelf: "center" }}>{r.strategyName}</div>
                                        <div style={{ alignSelf: "center", textTransform: "capitalize" }}>{r.kind}</div>
                                        <div style={{ alignSelf: "center" }}>
                                            <div
                                                style={{
                                                    display: "inline-block",
                                                    padding: "2px 8px",
                                                    borderRadius: 999,
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    background:
                                                        r.status === "SUCCEEDED"
                                                            ? "rgba(16,185,129,.15)"
                                                            : r.status === "FAILED"
                                                                ? "rgba(239,68,68,.15)"
                                                                : r.status === "RUNNING"
                                                                    ? "rgba(59,130,246,.15)"
                                                                    : "rgba(156,163,175,.15)",
                                                }}
                                            >
                                                {r.status}
                                            </div>
                                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                                                {r.kpis?.cagr != null ? `CAGR ${(r.kpis.cagr * 100).toFixed(1)}%` : "—"}
                                                {r.kpis?.sharpe != null ? ` · Sharpe ${r.kpis.sharpe.toFixed(2)}` : ""}
                                                {r.kpis?.mdd != null ? ` · MDD ${(r.kpis.mdd * 100).toFixed(1)}%` : ""}
                                                {r.kpis?.trades != null ? ` · Trades ${r.kpis.trades}` : ""}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            {!loading && runs.length === 0 && <div style={{ padding: "1rem" }}>No runs yet.</div>}
                        </div>
                    </div>
                )}

                <Link href={routes.home} style={{ marginTop: "1rem", opacity: 0.7, textDecoration: "none" }}>
                    ← Back to home
                </Link>
            </section>
        </main>
    );
}