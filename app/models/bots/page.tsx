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
                setBots([
                    { id: "b_001", name: "RSI_Band / paper", mode: "paper", status: "RUNNING", equity: 10432.1, dayPnl: 123.4, pairlist: ["BTC/USDT", "ETH/USDT"] },
                    { id: "b_002", name: "Breakout_v2 / paper", mode: "paper", status: "STOPPED", equity: 10000, dayPnl: 0, pairlist: ["SOL/USDT"] },
                ]);
            }
        } catch { /* ignore */ }
    };

    useEffect(() => { refresh(); }, []);

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
                                    {b.pairlist?.length ? `Pairs: ${b.pairlist.join(", ")}` : "—"}
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
                    </div>
                )}

                <Link href={routes.home} style={{ marginTop: "1rem", opacity: 0.85, textDecoration: "none", color: "#e5e7eb" }}>
                    ← Back to home
                </Link>
            </section>
        </main>
    );
}