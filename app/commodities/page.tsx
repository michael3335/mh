// app/commodities/page.tsx
"use client";

import ASCIIText from "@/components/ASCIIText";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import HistoryModal from "@/components/HistoryModal";

/* Sparkline (unchanged) */
function Sparkline({ points, positive, width = 120, height = 32 }: { points: number[]; positive: boolean; width?: number; height?: number; }) {
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

/* Metric card — clickable */
function MetricCard({
    title, value, delta, deltaPct, series, onClick,
}: { title: string; value: string; delta: number | null; deltaPct: number | null; series: number[]; onClick?: () => void; }) {
    const isUp = (delta ?? 0) >= 0;
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                border: "1px solid var(--card-border, rgba(255,255,255,0.08))",
                borderRadius: 12,
                padding: "12px 14px",
                display: "grid",
                gap: 8,
                minWidth: 0,
                width: "100%",
                textAlign: "left",
                background: "transparent",
                cursor: "pointer",
            }}
        >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>{title}</span>
                <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: isUp ? "var(--pos, #22c55e)" : "var(--neg, #ef4444)" }}>
                    {delta != null && deltaPct != null ? `${isUp ? "▲" : "▼"} ${delta.toFixed(2)} (${deltaPct.toFixed(2)}%)` : "—"}
                </span>
            </div>
            <strong style={{ fontSize: 22, letterSpacing: 0.2 }}>{value}</strong>
            <div style={{ color: isUp ? "var(--pos, #22c55e)" : "var(--neg, #ef4444)" }}>
                <Sparkline points={series} positive={isUp} />
            </div>
        </button>
    );
}

const Badge = ({ children }: { children: React.ReactNode }) => (
    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, border: "1px solid currentColor", opacity: 0.7 }}>
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
    const [auItems, setAuItems] = useState<Item[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [asof, setAsof] = useState<number | null>(null);
    const [base, setBase] = useState<"AUD" | "USD">("AUD");

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyId, setHistoryId] = useState<string | null>(null);

    const audFmt = useMemo(() => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 }), []);
    const usdFmt = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }), []);
    const fmt = base === "AUD" ? audFmt : usdFmt;

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
                    setAuItems((json.auItems as Item[]) ?? null);
                    setAsof(json.asof as number);
                    setBase((json.base as "AUD" | "USD") ?? "AUD");
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? "Failed to load data");
            }
        }

        load();
        const id = setInterval(load, 300_000);
        return () => { cancelled = true; clearInterval(id); };
    }, [status]);

    const top = useMemo(() => (items ? items.slice(0, 4) : []), [items]);

    const openHistory = (id: string) => {
        setHistoryId(id);
        setHistoryOpen(true);
    };

    return (
        <main style={{ minHeight: "100svh", width: "100%", display: "grid", padding: "clamp(16px, 4vw, 32px)", gap: "clamp(16px, 4vw, 28px)" }}>
            {/* Header */}
            <header style={{ display: "grid", justifyItems: "center", gap: "1rem", textAlign: "center" }}>
                <div style={{ width: "min(92vw, 900px)", height: "clamp(80px, 18vw, 200px)", position: "relative" }}>
                    <ASCIIText text="Commodities Briefing" enableWaves interactive={false} />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", flexWrap: "wrap", opacity: 0.85 }}>
                    <Badge>Live snapshot</Badge>
                    <Badge>AV + FRED/Nasdaq</Badge>
                    <Badge>{base} base</Badge>
                    {asof && <Badge>{new Date(asof).toLocaleTimeString("en-AU")}</Badge>}
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
                    <Link href="/api/auth/signin" style={{ padding: "0.6rem 1.2rem", borderRadius: 8, fontWeight: 600, border: "2px solid currentColor", textDecoration: "none" }}>
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
                        <div role="status" style={{ border: "1px solid rgba(255,0,0,0.25)", color: "rgba(255,120,120,0.95)", borderRadius: 10, padding: "10px 12px", justifySelf: "center", maxWidth: 900, width: "100%" }}>
                            Live data error: {error}
                        </div>
                    )}

                    {/* Top overview cards (commodities) */}
                    <section aria-label="Overview" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, opacity: items ? 1 : 0.6 }}>
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
                            const value = c.price == null ? "—" : `${fmt.format(c.price)} ${c.unit.replace(`${base}/`, "")}`;
                            return (
                                <MetricCard
                                    key={c.id}
                                    title={`${c.name} • ${c.unit}`}
                                    value={value}
                                    delta={c.change}
                                    deltaPct={c.changePct}
                                    series={c.series}
                                    onClick={() => openHistory(c.id)}
                                />
                            );
                        })}
                    </section>

                    {/* Watchlist: Global commodities */}
                    <section aria-label="Watchlist" style={{ border: "1px solid var(--table-border, rgba(255,255,255,0.08))", borderRadius: 12, overflow: "hidden", opacity: items ? 1 : 0.6 }}>
                        <div role="table" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
                            <div role="row" style={{ display: "contents", fontSize: 12, opacity: 0.7 }}>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Ticker</div>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Last ({base})</div>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Δ ({base})</div>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Δ%</div>
                            </div>

                            {(items ?? []).map((c) => {
                                const up = (c.change ?? 0) >= 0;
                                const absDelta = c.change == null ? null : Math.abs(c.change);
                                return (
                                    <div
                                        role="row"
                                        key={`row-${c.id}`}
                                        style={{ display: "contents", fontVariantNumeric: "tabular-nums", cursor: "pointer" }}
                                        onClick={() => openHistory(c.id)}
                                    >
                                        <div role="cell" style={{ padding: "12px", textAlign: "left" }}>
                                            <strong>{c.name}</strong> <span style={{ opacity: 0.6, fontSize: 12 }}>({c.unit})</span>
                                        </div>
                                        <div role="cell" style={{ padding: "12px", textAlign: "right" }}>
                                            {c.price == null ? "—" : fmt.format(c.price)}
                                        </div>
                                        <div role="cell" style={{ padding: "12px", textAlign: "right", color: up ? "var(--pos, #22c55e)" : "var(--neg, #ef4444)" }}>
                                            {absDelta == null ? "—" : `${up ? "+" : ""}${absDelta.toFixed(2)}`}
                                        </div>
                                        <div role="cell" style={{ padding: "12px", textAlign: "right", color: up ? "var(--pos, #22c55e)" : "var(--neg, #ef4444)" }}>
                                            {c.changePct == null ? "—" : `${up ? "+" : ""}${c.changePct.toFixed(2)}%`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* AU Watchlist (proxies) */}
                    <section aria-label="AU Watchlist" style={{ border: "1px solid var(--table-border, rgba(255,255,255,0.08))", borderRadius: 12, overflow: "hidden", opacity: auItems ? 1 : 0.6 }}>
                        <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 600, opacity: 0.9 }}>
                            AU Watchlist (proxies)
                        </div>
                        <div role="table" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
                            <div role="row" style={{ display: "contents", fontSize: 12, opacity: 0.7 }}>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Name (Symbol)</div>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Last ({base})</div>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Δ ({base})</div>
                                <div role="columnheader" style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Δ%</div>
                            </div>

                            {(auItems ?? []).map((c) => {
                                const up = (c.change ?? 0) >= 0;
                                const absDelta = c.change == null ? null : Math.abs(c.change);
                                return (
                                    <div
                                        role="row"
                                        key={`row-au-${c.id}`}
                                        style={{ display: "contents", fontVariantNumeric: "tabular-nums", cursor: "pointer" }}
                                        onClick={() => openHistory(c.id)}
                                    >
                                        <div role="cell" style={{ padding: "12px", textAlign: "left" }}>
                                            <strong>{c.name}</strong> <span style={{ opacity: 0.6, fontSize: 12 }}>({c.symbol})</span>
                                        </div>
                                        <div role="cell" style={{ padding: "12px", textAlign: "right" }}>
                                            {c.price == null ? "—" : fmt.format(c.price)}
                                        </div>
                                        <div role="cell" style={{ padding: "12px", textAlign: "right", color: up ? "var(--pos, #22c55e)" : "var(--neg, #ef4444)" }}>
                                            {absDelta == null ? "—" : `${up ? "+" : ""}${absDelta.toFixed(2)}`}
                                        </div>
                                        <div role="cell" style={{ padding: "12px", textAlign: "right", color: up ? "var(--pos, #22c55e)" : "var(--neg, #ef4444)" }}>
                                            {c.changePct == null ? "—" : `${up ? "+" : ""}${c.changePct.toFixed(2)}%`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Notes */}
                    <section aria-label="Brief notes" style={{ display: "grid", gap: 8, maxWidth: 900, justifySelf: "center", opacity: 0.9, lineHeight: 1.6 }}>
                        <h2 style={{ fontSize: 16, margin: 0, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.6 }}>
                            Briefing Notes
                        </h2>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            <li>Gold (AUD) tracks USD &amp; real yields; AUDUSD moves can amplify local price swings.</li>
                            <li>Energy proxies (WDS/STO/FUEL.AX) reflect crude + LNG sentiment and local basis.</li>
                            <li>Iron ore proxies (BHP/RIO/FMG) capture China steel demand and freight.</li>
                            <li>Watch FX — a weak AUD lifts local commodity prices even if USD prices are flat.</li>
                        </ul>
                    </section>

                    <div style={{ justifySelf: "center" }}>
                        <Link href="/" style={{ opacity: 0.7, textDecoration: "none", fontSize: "0.9rem" }}>
                            ← Back to Home
                        </Link>
                    </div>
                </>
            )}

            {/* History modal */}
            <HistoryModal
                open={historyOpen}
                onClose={() => { setHistoryOpen(false); setHistoryId(null); }}
                id={historyId}
            />
        </main>
    );
}