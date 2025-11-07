"use client";

import ASCIIText from "@/components/ASCIIText";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const API = "/api/models";

type Bot = {
    id: string;
    name: string;
    mode: "paper" | "live";
    status: "STOPPED" | "RUNNING" | "ERROR";
    equity?: number;
    dayPnl?: number;
    pairlist?: string[];
    state?: Record<string, unknown> | null;
    logTail?: string | null;
    lastPromotion?: {
        id: string;
        status: string;
        target: string;
        runId?: string | null;
        createdAt: string;
    } | null;
};

export default function BotsPage() {
    const { status } = useSession();
    const routes = {
        home: "/" as Route,
        signin: "/api/auth/signin" as Route,
    };

    const [bots, setBots] = useState<Bot[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);

    const refresh = async () => {
        try {
            const res = await fetch(`${API}/bots`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setBots((data?.bots ?? []) as Bot[]);
            } else {
                setBots([]);
            }
        } catch {
            setBots([]);
        }
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 15000);
        return () => clearInterval(interval);
    }, []);

    const action = async (id: string, verb: "start" | "stop" | "restart") => {
        setBusyId(id);
        try {
            await fetch(`${API}/bots/${id}/${verb}`, { method: "POST" });
            await refresh();
        } finally {
            setBusyId(null);
        }
    };

    const card: React.CSSProperties = {
        textAlign: "left",
        border: "1px solid rgba(0,0,0,.12)",
        borderRadius: 12,
        padding: "1rem",
        background: "#fff",
        color: "#111",
        boxShadow: "0 2px 10px rgba(0,0,0,.12)",
    };

    const btn: React.CSSProperties = {
        padding: "0.55rem 0.9rem",
        borderRadius: 10,
        background: "#fff",
        color: "#111",
        border: "1px solid rgba(0,0,0,.2)",
        cursor: "pointer",
    };

    const badge = (bg: string): React.CSSProperties => ({
        fontSize: 12,
        fontWeight: 800,
        padding: "2px 8px",
        borderRadius: 999,
        background: bg,
        color: "#111",
    });

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
                    <ASCIIText text="Bots" enableWaves interactive={false} />
                </div>

                {status === "loading" && <p>Checking access…</p>}

                {status === "unauthenticated" && (
                    <>
                        <p>You must sign in to view bots.</p>
                        <Link
                            href={routes.signin}
                            style={{
                                padding: "0.7rem 1.2rem", borderRadius: 10, fontWeight: 800, textDecoration: "none",
                                background: "#fff", color: "#111", boxShadow: "0 2px 10px rgba(0,0,0,.18)"
                            }}
                        >
                            Sign In
                        </Link>
                    </>
                )}

                {status === "authenticated" && (
                    <div
                        style={{
                            display: "grid",
                            gap: "1rem",
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        }}
                    >
                        {bots.map((b) => (
                            <div key={b.id} style={card}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontWeight: 900 }}>{b.name}</div>
                                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                            <span style={badge("rgba(59,130,246,.25)")}>{b.mode}</span>
                                            <span style={badge(b.status === "RUNNING" ? "rgba(16,185,129,.2)" : b.status === "ERROR" ? "rgba(239,68,68,.25)" : "rgba(156,163,175,.25)")}>
                                                {b.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: 900 }}>${(b.equity ?? 0).toLocaleString()}</div>
                                        <div style={{ fontSize: 12, color: (b.dayPnl ?? 0) >= 0 ? "#16a34a" : "#dc2626" }}>
                                            {(b.dayPnl ?? 0) >= 0 ? "+" : ""}{(b.dayPnl ?? 0).toFixed(2)} today
                                        </div>
                                    </div>
                                </div>

                                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                                    {b.pairlist?.length ? `Pairs: ${b.pairlist.join(", ")}` : "Pairs: —"}
                                </div>

                                {b.lastPromotion && (
                                    <div style={{ marginTop: 10, fontSize: 12 }}>
                                        <strong>Promotion:</strong>{" "}
                                        <span style={badge("rgba(234,179,8,.25)")}>{b.lastPromotion.status}</span>{" "}
                                        <span style={{ opacity: 0.8 }}>
                                            → {b.lastPromotion.target} · Run {b.lastPromotion.runId ?? "—"}
                                        </span>
                                        <div style={{ opacity: 0.6 }}>
                                            {new Date(b.lastPromotion.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>State snapshot</div>
                                    <div
                                        style={{
                                            background: "rgba(0,0,0,.04)",
                                            borderRadius: 8,
                                            padding: "0.5rem",
                                            fontSize: 12,
                                            maxHeight: 100,
                                            overflow: "auto",
                                        }}
                                    >
                                        {b.state ? (
                                            <code style={{ whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                                                {JSON.stringify(b.state, null, 2)}
                                            </code>
                                        ) : (
                                            <span style={{ opacity: 0.7 }}>No snapshot uploaded</span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>Log tail</div>
                                    <pre
                                        style={{
                                            background: "#0b1020",
                                            color: "#f7fafc",
                                            borderRadius: 8,
                                            padding: "0.5rem",
                                            maxHeight: 140,
                                            overflow: "auto",
                                            fontSize: 12,
                                        }}
                                    >
                                        {b.logTail ?? "No logs yet."}
                                    </pre>
                                </div>

                                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                    <button onClick={() => action(b.id, "start")} disabled={busyId === b.id} style={{ ...btn, opacity: busyId === b.id ? 0.6 : 1 }}>Start</button>
                                    <button onClick={() => action(b.id, "stop")} disabled={busyId === b.id} style={{ ...btn, opacity: busyId === b.id ? 0.6 : 1 }}>Stop</button>
                                    <button
                                        onClick={() => action(b.id, "restart")}
                                        disabled={busyId === b.id}
                                        style={{ ...btn, background: "#111", color: "#fff", border: "none", opacity: busyId === b.id ? 0.6 : 1 }}
                                    >
                                        Restart
                                    </button>
                                </div>
                            </div>
                        ))}
                        {!bots.length && <div style={{ opacity: 0.85 }}>No bots found.</div>}
                    </div>
                )}

                <Link href={routes.home} style={{ marginTop: "1rem", opacity: 0.85, textDecoration: "none", color: "#e5e7eb" }}>
                    ← Back to home
                </Link>
            </section>
        </main>
    );
}
