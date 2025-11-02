"use client";

import ASCIIText from "@/components/ASCIIText";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
            const res = await fetch("/api/bots", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setBots(data?.bots ?? []);
            } else {
                setBots([
                    { id: "b_001", name: "RSI_Band / paper", mode: "paper", status: "RUNNING", equity: 10432.1, dayPnl: 123.4, pairlist: ["BTC/USDT", "ETH/USDT"] },
                    { id: "b_002", name: "Breakout_v2 / paper", mode: "paper", status: "STOPPED", equity: 10000, dayPnl: 0, pairlist: ["SOL/USDT"] },
                ]);
            }
        } catch {
            /* ignore */
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const action = async (id: string, verb: "start" | "stop" | "restart") => {
        setBusyId(id);
        try {
            await fetch(`/api/bots/${id}/${verb}`, { method: "POST" });
            await refresh();
        } finally {
            setBusyId(null);
        }
    };

    const badgeColor = (status: Bot["status"]) =>
        status === "RUNNING" ? "rgba(16,185,129,.15)" : status === "ERROR" ? "rgba(239,68,68,.15)" : "rgba(156,163,175,.15)";

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
                            display: "grid",
                            gap: "1rem",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        }}
                    >
                        {bots.map((b) => (
                            <div
                                key={b.id}
                                style={{
                                    textAlign: "left",
                                    border: "1px solid rgba(0,0,0,.12)",
                                    borderRadius: 12,
                                    padding: "1rem",
                                    background: "white",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{b.name}</div>
                                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    padding: "2px 8px",
                                                    borderRadius: 999,
                                                    background: "rgba(59,130,246,.15)",
                                                }}
                                            >
                                                {b.mode}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    padding: "2px 8px",
                                                    borderRadius: 999,
                                                    background: badgeColor(b.status),
                                                }}
                                            >
                                                {b.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: 700 }}>${(b.equity ?? 0).toLocaleString()}</div>
                                        <div style={{ fontSize: 12, color: (b.dayPnl ?? 0) >= 0 ? "#16a34a" : "#dc2626" }}>
                                            {(b.dayPnl ?? 0) >= 0 ? "+" : ""}
                                            ${(b.dayPnl ?? 0).toFixed(2)} today
                                        </div>
                                    </div>
                                </div>

                                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                                    {b.pairlist?.length ? `Pairs: ${b.pairlist.join(", ")}` : "—"}
                                </div>

                                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                    <button
                                        onClick={() => action(b.id, "start")}
                                        disabled={busyId === b.id}
                                        style={{
                                            padding: "0.5rem 0.9rem",
                                            borderRadius: 8,
                                            border: "1px solid rgba(0,0,0,.18)",
                                            background: "white",
                                            cursor: "pointer",
                                            opacity: busyId === b.id ? 0.6 : 1,
                                        }}
                                    >
                                        Start
                                    </button>
                                    <button
                                        onClick={() => action(b.id, "stop")}
                                        disabled={busyId === b.id}
                                        style={{
                                            padding: "0.5rem 0.9rem",
                                            borderRadius: 8,
                                            border: "1px solid rgba(0,0,0,.18)",
                                            background: "white",
                                            cursor: "pointer",
                                            opacity: busyId === b.id ? 0.6 : 1,
                                        }}
                                    >
                                        Stop
                                    </button>
                                    <button
                                        onClick={() => action(b.id, "restart")}
                                        disabled={busyId === b.id}
                                        style={{
                                            padding: "0.5rem 0.9rem",
                                            borderRadius: 8,
                                            border: "none",
                                            background: "black",
                                            color: "white",
                                            cursor: "pointer",
                                            opacity: busyId === b.id ? 0.6 : 1,
                                        }}
                                    >
                                        Restart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Link href={routes.home} style={{ marginTop: "1rem", opacity: 0.7, textDecoration: "none" }}>
                    ← Back to home
                </Link>
            </section>
        </main>
    );
}