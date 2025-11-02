"use client";

import ASCIIText from "@/components/ASCIIText";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* -------- Tiny sparkline (inline SVG) -------- */
function Sparkline({
    points,
    positive,
    width = 120,
    height = 32,
}: {
    points: number[];
    positive: boolean;
    width?: number;
    height?: number;
}) {
    if (!points?.length) {
        return (
            <svg width={width} height={height} aria-hidden>
                <rect x="0" y={height / 2 - 1} width={width} height="2" opacity={0.15} />
            </svg>
        );
    }

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = Math.max(1e-9, max - min);
    const stepX = width / Math.max(1, points.length - 1);
    const path = points
        .map((p, i) => {
            const x = i * stepX;
            const y = height - ((p - min) / range) * (height - 2) - 1;
            return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");

    const first = points[0];
    const last = points[points.length - 1];
    const dirUp = last >= first;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
            <line x1="0" x2={width} y1={height - 1} y2={height - 1} opacity={0.06} />
            <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="currentColor" opacity={positive ? 0.16 : 0.12} />
            <path d={path} fill="none" stroke="currentColor" strokeWidth="1.75" opacity={dirUp ? 0.95 : 0.75} />
        </svg>
    );
}

/* -------- Metric card -------- */
function MetricCard({
    title,
    value,
    delta,
    deltaPct,
    series,
}: {
    title: string;
    value: string;
    delta: number | null;
    deltaPct: number | null;
    series: number[];
}) {
    const isUp = (delta ?? 0) >= 0;
    return (
        <div
            style={{
                border: "1px solid var(--card-border, rgba(255,255,255,0.08))",
                borderRadius: 12,
                padding: "12px 14px",
                display: "grid",
                gap: 8,
                minWidth: 0,
            }}
        >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>{title}</span>
                <span
                    style={{
                        fontSize: 12,
                        fontVariantNumeric: "tabular-nums",
                        color: isUp ? "var(--pos, #22c55e)" : "var(--neg, #ef4444)",
                    }}
                >
                    {delta != null && deltaPct != null
                        ? `${isUp ? "▲" : "▼"} ${delta.toFixed(2)} (${deltaPct.toFixed(2)}%)`
                        : "—"}
                </span>
            </div>

            <strong style={{ fontSize: 22, letterSpacing: 0.2 }}>{value}</strong>

            <div style={{ color: isUp ? "var(--pos, #22c55e)" : "var(--neg, #ef4444)" }}>
                <Sparkline points={series} positive={isUp} />
            </div>
        </div>
    );
}

/* -------- Badge -------- */
const Badge = ({ children }: { children: React.ReactNode }) => (
    <span
        style={{
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid currentColor",
            opacity: 0.7,
        }}
    >
        {children}
    </span>
);

type Item = {
    id: string;
    symbol: string;
    name: string;
    unit: string;
    price: number | null;
    prev: number | null;
    change: number | null;
    changePct: number | null;
    series: number[];
};

export default function CommoditiesPage() {
    const { status } = useSession();

    const [items, setItems] = useState<Item[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [asof, setAsof] = useState<number | null>(null);

    // Fetch live data from our server route
    useEffect(() => {
        if (status !== "authenticated") return;
        let cancelled = false;

        async function load() {
            try {
                setError(null);
                const res = await fetch("/api/commodities", { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (!cancelled) {
                    setItems(json.items as Item[]);
                    setAsof(json.asof as number);
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? "Failed to load data");
            }
        }

        load();
        const id = setInterval(load, 60_000); // refresh every 60s
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [status]);

    const top = useMemo(() => (items ? items.slice(0, 4) : []), [items]);
    const rest = useMemo(() => (items ? items.slice(4) : []), [items]);

    return (
        <main
            style={{
                minHeight: "100svh",
                width: "100%",
                display: "grid",
                padding: "clamp(16px, 4vw, 32px)",
                gap: "clamp(16px, 4vw, 28px)",
            }}
        >
            {/* Header */}
            <header style={{ display: "grid", justifyItems: "center", gap: "1rem", textAlign: "center" }}>
                <div style={{ width: "min(92vw, 900px)", height: "clamp(80px, 18vw, 200px)", position: "relative" }}>
                    <ASCIIText text="Commodities Briefing" enableWaves interactive={false} />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", flexWrap: "wrap", opacity: 0.85 }}>
                    <Badge>Live snapshot</Badge>
                    <Badge>Yahoo Finance</Badge>
                    <Badge>USD base</Badge>
                    {asof && <Badge>{new Date(asof).toLocaleTimeString()}</Badge>}
                </div>
            </header>

            {/* Access states */}
            {status === "loading" && (
                <section style={{ display: "grid", placeItems: "center", minHeight: 200 }}>
                    <p>Checking access…</p>
                </section>
            )}

            {status === "unauthenticated" && (
                <section style={{ display: "grid", placeItems: "center", gap: 12 }}>
                    <p>You must sign in to view the commodities briefing.</p>
                    <Link
                        href="/api/auth/signin"
                        style={{
                            padding: "0.6rem 1.2rem",
                            borderRadius: 8,
                            fontWeight: 600,
                            border: "2px solid currentColor",
                            textDecoration: "none",
                        }}
                    >
                        Sign In
                    </Link>
                    <Link href="/" style={{ opacity: 0.7, textDecoration: "none", marginTop: 8 }}>
                        ← Back to Home
                    </Link>
                </section>
            )}

            {status === "authenticated" && (
                <>
                    {/* Errors */}
                    {error && (
                        <div
                            role="status"
                            style={{
                                border: "1px solid rgba(255,0,0,0.25)",
                                color: "rgba(255,120,120,0.95)",
                                borderRadius: 10,
                                padding: "10px 12px",
                                justifySelf: "center",
                                maxWidth: 900,
                                width: "100%",
                            }}
                        >
                            Live data error: {error}
                        </div>
                    )}

                    {/* Top overview cards */}
                    <section
                        aria-label="Overview"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 12,
                            opacity: items ? 1 : 0.6,
                        }}
                    >
                        {(items ? top : Array.from({ length: 4 })).map((c: any, i: number) => {
                            if (!items) {
                                return (
                                    <div key={`skeleton-${i}`} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px" }}>
                                        <div style={{ height: 16, width: "60%", background: "rgba(255,255,255,0.08)", marginBottom: 8 }} />
                                        <div style={{ height: 24, width: "40%", background: "rgba(255,255,255,0.12)", marginBottom: 8 }} />
                                        <div style={{ height: 32, width: "100%", background: "rgba(255,255,255,0.06)" }} />
                                    </div>
                                );
                            }
                            const value = c.price == null ? "—" : c.price.toLocaleString();
                            return (
                                <MetricCard
                                    key={c.id}
                                    title={`${c.name} • ${c.unit}`}
                                    value={value}
                                    delta={c.change}
                                    deltaPct={c.changePct}
                                    series={c.series}
                                />
                            );
                        })}
                    </section>

                    {/* Watchlist table */}
                    <section
                        aria-label="Watchlist"
                        style={{
                            border: "1px solid var(--table-border, rgba(255,255,255,0.08))",
                            borderRadius: 12,
                            overflow: "hidden",
                            opacity: items ? 1 : 0.6,
                        }}
                    >
                        <div role="table" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
                            <div role="row" style={{ display: "contents", fontSize: 12, opacity: 0.7 }}>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    Ticker
                                </div>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    Last
                                </div>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    Δ
                                </div>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    Δ%
                                </div>
                            </div>

                            {(items ?? []).map((c) => {
                                const up = (c.change ?? 0) >= 0;
                                return (
                                    <div role="row" key={`row-${c.id}`} style={{ display: "contents", fontVariantNumeric: "tabular-nums" }}>
                                        <div role="cell" style={{ padding: "12px", textAlign: "left" }}>
                                            <strong>{c.name}</strong> <span style={{ opacity: 0.6, fontSize: 12 }}>({c.unit})</span>
                                        </div>
                                        <div role="cell" style={{ padding: "12px", textAlign: "right" }}>
                                            {c.price == null ? "—" : c.price.toLocaleString()}
                                        </div>
                                        <div
                                            role="cell"
                                            style={{ padding: "12px", textAlign: "right", color: up ? "var(--pos, #22c55e)" : "var(--neg, #ef4444)" }}
                                        >
                                            {c.change == null ? "—" : `${up ? "+" : ""}${c.change.toFixed(2)}`}
                                        </div>
                                        <div
                                            role="cell"
                                            style={{ padding: "12px", textAlign: "right", color: up ? "var(--pos, #22c55e)" : "var(--neg, #ef4444)" }}
                                        >
                                            {c.changePct == null ? "—" : `${up ? "+" : ""}${c.changePct.toFixed(2)}%`}
                                        </div>
                                    </div>
                                );
                            })}

                            {!items && (
                                <>
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div key={`srow-${i}`} role="row" style={{ display: "contents" }}>
                                            {Array.from({ length: 4 }).map((__, j) => (
                                                <div key={`scell-${i}-${j}`} role="cell" style={{ padding: "12px" }}>
                                                    <div style={{ height: 16, width: j === 0 ? "60%" : "40%", background: "rgba(255,255,255,0.06)" }} />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </section>

                    {/* Notes / Brief */}
                    <section
                        aria-label="Brief notes"
                        style={{
                            display: "grid",
                            gap: 8,
                            maxWidth: 900,
                            justifySelf: "center",
                            opacity: 0.9,
                            lineHeight: 1.6,
                        }}
                    >
                        <h2 style={{ fontSize: 16, margin: 0, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.6 }}>
                            Briefing Notes
                        </h2>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            <li>Gold tracks USD & yields; watch real-rate moves for direction.</li>
                            <li>Crude reacting to inventory prints and OPEC+ rhetoric; curve shape in focus.</li>
                            <li>Copper steady; macro growth & China demand remain key drivers.</li>
                            <li>Grains sensitive to weather & logistics; volatility can spike on headlines.</li>
                        </ul>
                    </section>

                    {/* Back link */}
                    <div style={{ justifySelf: "center" }}>
                        <Link href="/" style={{ opacity: 0.7, textDecoration: "none", fontSize: "0.9rem" }}>
                            ← Back to Home
                        </Link>
                    </div>
                </>
            )}
        </main>
    );
}