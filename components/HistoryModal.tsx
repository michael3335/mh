// components/HistoryModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

/* ---------- Types ---------- */
type SeriesPoint = { date: string; value: number };
type ApiPayload = {
    id: string;
    title: string;
    unitUSD: string; // e.g., "USD/oz" or "USD"
    fx: { audusd: number | null }; // USD per 1 AUD
    seriesUSD: SeriesPoint[]; // ascending full history in USD
    asof: number;
};

type Props = {
    open: boolean;
    onClose: () => void;
    id: string | null; // series id
};

type TimeKey = "1M" | "3M" | "6M" | "1Y" | "5Y" | "Max";
type CurrencyKey = "USD" | "AUD";

/* ---------- Helpers ---------- */

const timeframes: { key: TimeKey; days: number }[] = [
    { key: "1M", days: 30 },
    { key: "3M", days: 90 },
    { key: "6M", days: 180 },
    { key: "1Y", days: 365 },
    { key: "5Y", days: 365 * 5 },
    { key: "Max", days: Infinity },
];

const usdToAud = (v: number, audusd: number | null) =>
    audusd && audusd > 0 ? v / audusd : null;

/* ---------- Chart ---------- */

function HistoryChart({
    data, width = 700, height = 300,
}: { data: SeriesPoint[]; width?: number; height?: number }) {
    if (!data?.length) {
        return <div style={{ height, display: "grid", placeItems: "center", opacity: 0.7 }}>No data</div>;
    }
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padY = (max - min) * 0.1 || 1;
    const yMin = min - padY;
    const yMax = max + padY;

    const stepX = width / Math.max(1, data.length - 1);
    const toY = (v: number) => {
        const t = (v - yMin) / Math.max(1e-9, yMax - yMin);
        return height - t * (height - 24) - 8;
    };

    const dPath = data.map((d, i) => {
        const x = i * stepX;
        const y = toY(d.value);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");

    const first = values[0];
    const last = values[values.length - 1];
    const pct = first ? ((last - first) / first) * 100 : 0;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
                <div>Change: {last.toFixed(2)} vs {first.toFixed(2)} ({pct.toFixed(2)}%)</div>
                <div>{data[0].date} → {data[data.length - 1].date}</div>
            </div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price history">
                <rect x="0" y="0" width={width} height={height} fill="none" />
                <line x1="0" x2={width} y1={height - 8} y2={height - 8} opacity={0.15} />
                <path d={`${dPath} L ${width} ${height - 8} L 0 ${height - 8} Z`} fill="currentColor" opacity={0.12} />
                <path d={dPath} fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
        </div>
    );
}

/* ---------- Modal Shell ---------- */

function ModalShell({
    open, onClose, title, subtitle, children,
}: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                display: "grid", placeItems: "center", zIndex: 1000, padding: 16
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "min(94vw, 900px)",
                    background: "var(--modal-bg, #0b0b0b)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    padding: 16,
                    display: "grid",
                    gap: 12
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
                        {subtitle && <div style={{ opacity: 0.7, fontSize: 12 }}>{subtitle}</div>}
                    </div>
                    <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

/* ---------- History Modal (fetch + controls) ---------- */

export default function HistoryModal({ open, onClose, id }: Props) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [payload, setPayload] = useState<ApiPayload | null>(null);

    const [tf, setTf] = useState<TimeKey>("6M");
    const [ccy, setCcy] = useState<CurrencyKey>("AUD"); // default to AUD for AU users

    useEffect(() => {
        if (!open || !id) return;
        let cancelled = false;
        setLoading(true);
        setErr(null);
        setPayload(null);

        (async () => {
            try {
                const res = await fetch(`/api/commodities/${encodeURIComponent(id)}`, { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const j = (await res.json()) as ApiPayload;
                if (!cancelled) {
                    setPayload(j);
                    // If no FX available, force USD
                    if (!j.fx?.audusd) setCcy("USD");
                }
            } catch (e: any) {
                if (!cancelled) setErr(e?.message ?? "Failed to load history");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [open, id]);

    const series = useMemo<SeriesPoint[]>(() => {
        if (!payload) return [];
        if (ccy === "USD") return payload.seriesUSD;
        // AUD
        const rate = payload.fx?.audusd ?? null; // USD per 1 AUD
        if (!rate) return []; // no FX → cannot show AUD
        return payload.seriesUSD.map((p) => ({ date: p.date, value: (p.value / rate) }));
    }, [payload, ccy]);

    const filtered = useMemo(() => {
        if (!series.length) return [];
        const tfConf = timeframes.find((x) => x.key === tf) ?? timeframes[2];
        if (!isFinite(tfConf.days) || tfConf.days === Infinity) return series;
        const cutoff = new Date(Date.now() - tfConf.days * 86400000);
        return series.filter((p) => new Date(p.date) >= cutoff);
    }, [series, tf]);

    const subtitle = useMemo(() => {
        if (!payload) return undefined;
        const unit = ccy === "USD" ? payload.unitUSD : payload.unitUSD.replace("USD", "AUD");
        return `${unit} • ${new Date(payload.asof).toLocaleString("en-AU")}`;
    }, [payload, ccy]);

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title={payload?.title ?? (id ? `Loading ${id}…` : "History")}
            subtitle={subtitle}
        >
            {loading && <div style={{ padding: 16, opacity: 0.8 }}>Loading…</div>}
            {err && (
                <div style={{ padding: 16, color: "rgba(255,120,120,0.95)", border: "1px solid rgba(255,0,0,0.25)", borderRadius: 8 }}>
                    {err}
                </div>
            )}
            {!loading && !err && payload && (
                <>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {timeframes.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => setTf(t.key)}
                                    style={{
                                        padding: "4px 10px",
                                        borderRadius: 999,
                                        border: "1px solid currentColor",
                                        opacity: tf === t.key ? 1 : 0.7,
                                        background: "transparent",
                                        cursor: "pointer",
                                        fontSize: 12
                                    }}
                                >
                                    {t.key}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                            <button
                                onClick={() => setCcy("USD")}
                                disabled={ccy === "USD"}
                                style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid currentColor", background: "transparent", opacity: ccy === "USD" ? 1 : 0.8, cursor: ccy === "USD" ? "default" : "pointer", fontSize: 12 }}
                            >
                                USD
                            </button>
                            <button
                                onClick={() => setCcy("AUD")}
                                disabled={!payload.fx?.audusd || ccy === "AUD"}
                                title={!payload.fx?.audusd ? "AUD unavailable (no FX)" : ""}
                                style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid currentColor", background: "transparent", opacity: ccy === "AUD" ? 1 : (payload.fx?.audusd ? 0.8 : 0.4), cursor: !payload.fx?.audusd || ccy === "AUD" ? "default" : "pointer", fontSize: 12 }}
                            >
                                AUD
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                        <HistoryChart data={filtered} />
                    </div>
                </>
            )}
        </ModalShell>
    );
}