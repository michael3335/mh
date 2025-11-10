"use client";

import ModelsShell, { useModelsContext } from "@/components/models/ModelsShell";
import Link from "next/link";
import type { Route } from "next";
import { useMemo } from "react";
import { useModelApi } from "@/lib/hooks/useModelApi";

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
    return (
        <ModelsShell title="Runs" unauthenticatedMessage="You must sign in to view runs.">
            <RunsContent />
        </ModelsShell>
    );
}

function RunsContent() {
    const { status } = useModelsContext();
    const enabled = status === "authenticated";

    const { data, loading, error } = useModelApi<Run[]>(
        enabled ? `${API}/runs` : null,
        {
            enabled,
            parser: async (res) => {
                const payload = await res.json().catch(() => ({ runs: [] }));
                return (payload?.runs ?? []) as Run[];
            },
        }
    );

    const runs = data ?? [];
    const routes = useMemo(
        () => ({
            runDetails: (id: string) => `/models/runs/${encodeURIComponent(id)}` as Route,
        }),
        []
    );

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
        <>
            {error && (
                <div
                    style={{
                        background: "rgba(239,68,68,.15)",
                        border: "1px solid rgba(239,68,68,.4)",
                        borderRadius: 12,
                        padding: "0.6rem 0.9rem",
                        color: "#fee2e2",
                        fontSize: 13,
                    }}
                >
                    {error}
                </div>
            )}

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
                            <div style={{ textAlign: "left" }}>
                                <div style={{ fontWeight: 800 }}>{r.id}</div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>
                                    {new Date(r.startedAt).toLocaleString()}
                                    {r.finishedAt ? ` → ${new Date(r.finishedAt).toLocaleTimeString()}` : ""}
                                </div>
                                <Link
                                    href={routes.runDetails(r.id)}
                                    style={{ fontSize: 12, marginTop: 4, display: "inline-block", color: "#2563eb", textDecoration: "none" }}
                                >
                                    View details →
                                </Link>
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
        </>
    );
}
