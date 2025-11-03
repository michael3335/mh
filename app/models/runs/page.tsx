"use client";

import ASCIIText from "@/components/ASCIIText";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const API = "/api/models";

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
    const routes = { home: "/" as Route, signin: "/api/auth/signin" as Route };

    const [runs, setRuns] = useState<Run[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let abort = false;
        (async () => {
            try {
                const res = await fetch(`${API}/runs`, { cache: "no-store" });
                if (!abort) {
                    if (res.ok) {
                        const data = await res.json();
                        setRuns((data?.runs ?? []) as Run[]);
                    } else {
                        setRuns([]);
                    }
                }
            } finally {
                if (!abort) setLoading(false);
            }
        })();
        return () => { abort = true; };
    }, []);

    const panel: React.CSSProperties = {
        background: "#fff",
        color: "#111",
        border: "1px solid rgba(0,0,0,.12)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,.12)",
    };

    const th: React.CSSProperties = {
        fontSize: 12,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: ".04em",
        padding: "0.75rem 1rem",
        background: "rgba(0,0,0,.04)",
        color: "#111",
    };

    const row: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
        gap: "0.5rem",
        padding: "0.9rem 1rem",
        borderTop: "1px solid rgba(0,0,0,.06)",
        textAlign: "left",
        color: "#111",
        background: "#fff",
    };

    const badge = (s: Run["status"]) => ({
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background:
            s === "SUCCEEDED" ? "rgba(16,185,129,.2)" :
                s === "FAILED" ? "rgba(239,68,68,.25)" :
                    s === "RUNNING" ? "rgba(59,130,246,.25)" :
                        "rgba(156,163,175,.25)",
        color: "#111",
    } as React.CSSProperties);

    return (
        <main
            style={{
                minHeight: "100svh",
                width: "100%",
                display: "grid",
                placeItems: "center",
                padding: "2rem",
                textAlign: "center",
                background: "#111213",
                color: "#f4f4f5",
            }}
        >
            <section style={{ display: "grid", gap: "1.5rem", width: "min(100%, 960px)" }}>
                <div style={{ width: "min(90vw, 700px)", height: "clamp(80px, 20vw, 200px)", position: "relative", margin: "0 auto" }}>
                    <ASCIIText text="Runs" enableWaves interactive={false} />
                </div>

                {status === "loading" && <p>Checking access…</p>}

                {status === "unauthenticated" && (
                    <>
                        <p>You must sign in to view runs.</p>
                        <Link href={routes.signin} style={{
                            padding: "0.7rem 1.2rem", borderRadius: 10, fontWeight: 800, textDecoration: "none",
                            background: "#fff", color: "#111", boxShadow: "0 2px 10px rgba(0,0,0,.18)"
                        }}>
                            Sign In
                        </Link>
                    </>
                )}

                {status === "authenticated" && (
                    <div style={panel}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr" }}>
                            <div style={th}>Run / Time</div>
                            <div style={th}>Strategy</div>
                            <div style={th}>Type</div>
                            <div style={th}>Status / KPIs</div>
                        </div>

                        <div>
                            {loading && <div style={{ padding: "1rem", color: "#111" }}>Loading…</div>}
                            {!loading && runs.map((r) => (
                                <div key={r.id} style={row}>
                                    <div>
                                        <div style={{ fontWeight: 800 }}>{r.id}</div>
                                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                                            {new Date(r.startedAt).toLocaleString()}
                                            {r.finishedAt ? ` → ${new Date(r.finishedAt).toLocaleTimeString()}` : ""}
                                        </div>
                                    </div>
                                    <div style={{ alignSelf: "center" }}>{r.strategyName}</div>
                                    <div style={{ alignSelf: "center", textTransform: "capitalize" }}>{r.kind}</div>
                                    <div style={{ alignSelf: "center" }}>
                                        <span style={badge(r.status)}>{r.status}</span>
                                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                                            {r.kpis?.cagr != null ? `CAGR ${(r.kpis.cagr * 100).toFixed(1)}%` : "—"}
                                            {r.kpis?.sharpe != null ? ` · Sharpe ${r.kpis.sharpe.toFixed(2)}` : ""}
                                            {r.kpis?.mdd != null ? ` · MDD ${(r.kpis.mdd * 100).toFixed(1)}%` : ""}
                                            {r.kpis?.trades != null ? ` · Trades ${r.kpis.trades}` : ""}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!loading && runs.length === 0 && <div style={{ padding: "1rem", color: "#111" }}>No runs yet.</div>}
                        </div>
                    </div>
                )}

                <Link href={routes.home} style={{ marginTop: "1rem", opacity: 0.85, textDecoration: "none", color: "#e5e7eb" }}>
                    ← Back to home
                </Link>
            </section>
        </main>
    );
}