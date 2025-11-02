// components/HistoryModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Crosshair from "./Crosshair";

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

type Props = { open: boolean; onClose: () => void; id: string | null };

type TimeKey = "1M" | "3M" | "6M" | "1Y" | "5Y" | "Max";
type CurrencyKey = "USD" | "AUD";
type ViewMode = "chart" | "table";

/* ---------- Helpers ---------- */
const timeframes: { key: TimeKey; days: number }[] = [
    { key: "1M", days: 30 },
    { key: "3M", days: 90 },
    { key: "6M", days: 180 },
    { key: "1Y", days: 365 },
    { key: "5Y", days: 365 * 5 },
    { key: "Max", days: Infinity },
];

function formatDate(dISO: string) {
    const d = new Date(dISO);
    return d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
}
function formatDateDense(dISO: string) {
    const d = new Date(dISO);
    return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "2-digit" });
}
function niceNumber(x: number, round = true) {
    const exp = Math.floor(Math.log10(Math.max(1e-12, Math.abs(x))));
    const f = x / Math.pow(10, exp);
    const nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
    const n = nf * Math.pow(10, exp);
    return round ? n : nf;
}
function formatNumber(v: number) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2,
    }).format(v);
}

/* ---------- Chart with your cursor rules ---------- */
function HistoryChart({
    data,
    unitLabel,
    width = 760,
    height = 340,
}: {
    data: SeriesPoint[];
    unitLabel: string;
    width?: number;
    height?: number;
}) {
    if (!data?.length) {
        return <div style={{ height, display: "grid", placeItems: "center", opacity: 0.7 }}>No data</div>;
    }

    // Layout
    const m = { top: 16, right: 16, bottom: 44, left: 64 };
    const iw = Math.max(10, width - m.left - m.right);
    const ih = Math.max(10, height - m.top - m.bottom);

    // Theme
    const gridY = "rgba(255,255,255,0.12)";
    const gridX = "rgba(255,255,255,0.10)";
    const axis = "rgba(255,255,255,0.6)";
    const label = "rgba(255,255,255,0.9)";

    // Domains
    const xs = useMemo(() => data.map((d) => new Date(d.date).getTime()), [data]);
    const ys = useMemo(() => data.map((d) => d.value), [data]);
    const xMin = xs[0];
    const xMax = xs[xs.length - 1];

    const yMinRaw = Math.min(...ys);
    const yMaxRaw = Math.max(...ys);
    const pad = (yMaxRaw - yMinRaw) * 0.08 || 1;
    const yMin = Math.max(0, yMinRaw - pad);
    const yMax = yMaxRaw + pad;

    // Scales
    const xScale = (t: number) => m.left + ((t - xMin) / Math.max(1, xMax - xMin)) * iw;
    const yScale = (v: number) => m.top + (1 - (v - yMin) / Math.max(1e-12, yMax - yMin)) * ih;

    // Trend color: green / red / gray
    const firstVal = ys[0];
    const lastVal = ys[ys.length - 1];
    const delta = lastVal - firstVal;
    const chartColor =
        delta > 0 ? "var(--pos, #22c55e)" : delta < 0 ? "var(--neg, #ef4444)" : "rgba(255,255,255,0.9)";

    // Path
    const dPath = useMemo(
        () =>
            data
                .map((d, i) => {
                    const x = xScale(new Date(d.date).getTime());
                    const y = yScale(d.value);
                    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .join(" "),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [data, xMin, xMax, yMin, yMax, iw, ih]
    );

    // Ticks
    const yTickCount = 6;
    const stepRaw = (yMax - yMin) / (yTickCount - 1);
    const step = niceNumber(stepRaw);
    const yStart = Math.floor(yMin / step) * step;
    const yTicks: number[] = [];
    for (let y = yStart; y <= yMax + 1e-9; y += step) if (y >= yMin - 1e-9) yTicks.push(Number(y.toFixed(10)));

    const xTickCount = 6;
    const xTicks: number[] = [];
    for (let i = 0; i < xTickCount; i++) xTicks.push(xMin + ((xMax - xMin) * i) / (xTickCount - 1));

    // Header change
    const pct = firstVal ? ((lastVal - firstVal) / firstVal) * 100 : 0;

    /* ----- Cursor state following your rules ----- */
    const containerRef = useRef<HTMLElement | null>(null);

    // vertical line: cursor X (px inside container)
    const [cursorX, setCursorX] = useState<number | null>(null);

    // horizontal line + tooltip: cursor Y (px inside container)
    const [cursorY, setCursorY] = useState<number | null>(null);

    // snapped dot + data: nearest ACTUAL point by time to cursor X
    const [snapIdx, setSnapIdx] = useState<number | null>(null);

    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

    const nearestIndexFromXpx = (xPx: number) => {
        const t = xMin + ((xMax - xMin) * (xPx - m.left)) / iw;
        if (!Number.isFinite(t)) return null;
        let lo = 0,
            hi = xs.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (xs[mid] < t) lo = mid + 1;
            else hi = mid;
        }
        const a = Math.max(0, lo - 1);
        const b = lo;
        return Math.abs(xs[a] - t) <= Math.abs(xs[b] - t) ? a : b;
    };

    function onMove(e: React.MouseEvent<HTMLDivElement>) {
        const el = containerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const xPx = e.clientX - r.left;
        const yPx = e.clientY - r.top;

        const inside = xPx >= m.left && xPx <= m.left + iw && yPx >= m.top && yPx <= m.top + ih;
        if (!inside) {
            setCursorX(null);
            setCursorY(null);
            setSnapIdx(null);
            return;
        }

        const xBound = clamp(xPx, m.left, m.left + iw);
        const yBound = clamp(yPx, m.top, m.top + ih);

        setCursorX(xBound); // vertical line → cursor X
        setCursorY(yBound); // horizontal line + tooltip → cursor Y

        const idx = nearestIndexFromXpx(xBound);
        setSnapIdx(idx);
    }

    function onLeave() {
        setCursorX(null);
        setCursorY(null);
        setSnapIdx(null);
    }

    return (
        <div
            ref={(el) => (containerRef.current = el)}
            style={{ position: "relative", width: "100%", height, overflow: "hidden", color: chartColor }}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
        >
            {/* Crosshair: vX = cursorX, hY = cursorY (follows mouse) */}
            <Crosshair
                containerRef={containerRef}
                color="currentColor"
                mode="controlled"
                vX={cursorX}
                hY={cursorY}
                show={cursorX != null && cursorY != null}
            />

            <svg
                width="100%"
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label={`Price history (${unitLabel}) with axes`}
                shapeRendering="crispEdges"
            >
                {/* Plot background */}
                <rect x={m.left} y={m.top} width={iw} height={ih} fill="none" />

                {/* Y grid + labels */}
                {yTicks.map((yt, i) => {
                    const y = yScale(yt);
                    return (
                        <g key={`y-${i}`}>
                            <line x1={m.left} x2={m.left + iw} y1={y} y2={y} stroke={gridY} strokeWidth={1} />
                            <text x={m.left - 8} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: 12, fill: label }}>
                                {formatNumber(yt)}
                            </text>
                        </g>
                    );
                })}

                {/* X grid + labels */}
                {xTicks.map((xt, i) => {
                    const x = xScale(xt);
                    return (
                        <g key={`x-${i}`}>
                            <line x1={x} x2={x} y1={m.top} y2={m.top + ih} stroke={gridX} strokeWidth={1} />
                            <text x={x} y={m.top + ih + 18} textAnchor="middle" style={{ fontSize: 12, fill: label }}>
                                {formatDate(new Date(xt).toISOString())}
                            </text>
                        </g>
                    );
                })}

                {/* Axes */}
                <line x1={m.left} x2={m.left} y1={m.top} y2={m.top + ih} stroke={axis} strokeWidth={1} />
                <line x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} stroke={axis} strokeWidth={1} />

                {/* Axis labels */}
                <text x={m.left + iw / 2} y={height - 6} textAnchor="middle" style={{ fontSize: 12, fill: label }}>
                    Date
                </text>
                <text
                    x={12}
                    y={m.top + ih / 2}
                    transform={`rotate(-90, 12, ${m.top + ih / 2})`}
                    textAnchor="middle"
                    style={{ fontSize: 12, fill: label }}
                >
                    Price ({unitLabel})
                </text>

                {/* Area + line (inherit chartColor via currentColor) */}
                <path d={`${dPath} L ${m.left + iw} ${m.top + ih} L ${m.left} ${m.top + ih} Z`} fill="currentColor" opacity={0.12} />
                <path d={dPath} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />

                {/* Snapped dot at nearest REAL point */}
                {snapIdx != null && (
                    <circle
                        cx={xScale(xs[snapIdx])}
                        cy={yScale(ys[snapIdx])}
                        r={4}
                        fill="currentColor"
                        stroke="white"
                        strokeWidth={1}
                    />
                )}
            </svg>

            {/* Tooltip follows cursor Y, shows data from snapped index */}
            {cursorX != null && cursorY != null && snapIdx != null && (
                <div
                    role="note"
                    style={{
                        position: "absolute",
                        left: Math.min(Math.max(cursorX + 8, m.left), m.left + iw - 220),
                        top: Math.max(cursorY - 44, m.top + 4),
                        width: 208,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(0,0,0,0.8)",
                        fontSize: 12,
                        lineHeight: 1.4,
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ opacity: 0.85 }}>{formatDateDense(data[snapIdx].date)}</div>
                    <div style={{ fontWeight: 700 }}>
                        {new Intl.NumberFormat(unitLabel.startsWith("AUD") ? "en-AU" : "en-US", {
                            style: unitLabel.startsWith("USD") || unitLabel.startsWith("AUD") ? "currency" : "decimal",
                            currency: unitLabel.startsWith("AUD") ? "AUD" : unitLabel.startsWith("USD") ? "USD" : undefined,
                            maximumFractionDigits: 2,
                        }).format(data[snapIdx].value)}{" "}
                        <span style={{ opacity: 0.7, fontWeight: 400 }}>
                            {unitLabel.replace(/^(USD|AUD)/, "").trim()}
                        </span>
                    </div>
                </div>
            )}

            {/* Header: change over visible range */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0 4px 8px 4px",
                    fontVariantNumeric: "tabular-nums",
                    pointerEvents: "none",
                    color: "inherit",
                }}
            >
                <div>
                    Change: {formatNumber(lastVal)} vs {formatNumber(firstVal)} ({pct.toFixed(2)}%)
                </div>
                <div>
                    {formatDateDense(data[0].date)} → {formatDateDense(data[data.length - 1].date)}
                </div>
            </div>
        </div>
    );
}

/* ---------- Modal Shell ---------- */
function ModalShell({
    open,
    onClose,
    title,
    subtitle,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "grid",
                placeItems: "center",
                zIndex: 1000,
                padding: 16,
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
                    gap: 12,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
                        {subtitle && <div style={{ opacity: 0.7, fontSize: 12 }}>{subtitle}</div>}
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: 8,
                            padding: "6px 10px",
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
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
    const [ccy, setCcy] = useState<CurrencyKey>("AUD");
    const [view, setView] = useState<ViewMode>("chart");

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
                    if (!j.fx?.audusd) setCcy("USD");
                }
            } catch (e: any) {
                if (!cancelled) setErr(e?.message ?? "Failed to load history");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, id]);

    const series = useMemo<SeriesPoint[]>(() => {
        if (!payload) return [];
        if (ccy === "USD") return payload.seriesUSD;
        const rate = payload.fx?.audusd ?? null;
        if (!rate) return [];
        return payload.seriesUSD.map((p) => ({ date: p.date, value: p.value / rate }));
    }, [payload, ccy]);

    const filtered = useMemo(() => {
        if (!series.length) return [];
        const tfConf = timeframes.find((x) => x.key === tf) ?? timeframes[2];
        if (!isFinite(tfConf.days) || tfConf.days === Infinity) return series;
        const cutoff = new Date(Date.now() - tfConf.days * 86400000);
        return series.filter((p) => new Date(p.date) >= cutoff);
    }, [series, tf]);

    const unitLabel = useMemo(() => {
        if (!payload) return "";
        return ccy === "USD" ? payload.unitUSD : payload.unitUSD.replace("USD", "AUD");
    }, [payload, ccy]);

    const subtitle = useMemo(() => {
        if (!payload) return undefined;
        return `${unitLabel} • ${new Date(payload.asof).toLocaleString("en-AU")}`;
    }, [payload, unitLabel]);

    const numberFmt = useMemo(() => {
        const currency = ccy;
        const hasCurrency = payload?.unitUSD?.startsWith("USD");
        return hasCurrency
            ? new Intl.NumberFormat(currency === "AUD" ? "en-AU" : "en-US", {
                style: "currency",
                currency,
                maximumFractionDigits: 2,
            })
            : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
    }, [ccy, payload?.unitUSD]);

    function downloadCSV() {
        const rows = [["Date", `Price (${unitLabel})`], ...filtered.map((r) => [r.date, String(r.value)])];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${payload?.id ?? "series"}_${ccy}_${tf}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <ModalShell open={open} onClose={onClose} title={payload?.title ?? (id ? `Loading ${id}…` : "History")} subtitle={subtitle}>
            {loading && <div style={{ padding: 16, opacity: 0.8 }}>Loading…</div>}
            {err && <div style={{ padding: 16, color: "rgba(255,120,120,0.95)", border: "1px solid rgba(255,0,0,0.25)", borderRadius: 8 }}>{err}</div>}
            {!loading && !err && payload && (
                <>
                    {/* Controls */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {timeframes.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => setTf(t.key)}
                                    style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid currentColor", opacity: tf === t.key ? 1 : 0.7, background: "transparent", cursor: "pointer", fontSize: 12 }}
                                >
                                    {t.key}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <div role="tablist" aria-label="View mode" style={{ display: "flex", gap: 6 }}>
                                <button role="tab" aria-selected={view === "chart"} onClick={() => setView("chart")} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid currentColor", background: "transparent", opacity: view === "chart" ? 1 : 0.7, cursor: "pointer", fontSize: 12 }}>
                                    Chart
                                </button>
                                <button role="tab" aria-selected={view === "table"} onClick={() => setView("table")} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid currentColor", background: "transparent", opacity: view === "table" ? 1 : 0.7, cursor: "pointer", fontSize: 12 }}>
                                    Table
                                </button>
                            </div>

                            <div style={{ width: 8 }} />

                            <button onClick={() => setCcy("USD")} disabled={ccy === "USD"} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid currentColor", background: "transparent", opacity: ccy === "USD" ? 1 : 0.8, cursor: ccy === "USD" ? "default" : "pointer", fontSize: 12 }}>
                                USD
                            </button>
                            <button
                                onClick={() => setCcy("AUD")}
                                disabled={!payload.fx?.audusd || ccy === "AUD"}
                                title={!payload.fx?.audusd ? "AUD unavailable (no FX)" : ""}
                                style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid currentColor", background: "transparent", opacity: ccy === "AUD" ? 1 : payload.fx?.audusd ? 0.8 : 0.4, cursor: !payload.fx?.audusd || ccy === "AUD" ? "default" : "pointer", fontSize: 12 }}
                            >
                                AUD
                            </button>

                            <div style={{ width: 8 }} />

                            <button onClick={downloadCSV} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid currentColor", background: "transparent", cursor: "pointer", fontSize: 12 }}>
                                Download CSV
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ marginTop: 8 }}>
                        {view === "chart" ? (
                            <HistoryChart data={filtered} unitLabel={unitLabel} />
                        ) : (
                            <div role="region" aria-label="Price history table" style={{ maxHeight: 360, overflow: "auto", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}>
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontVariantNumeric: "tabular-nums" }}>
                                    <thead style={{ position: "sticky", top: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
                                        <tr>
                                            <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.12)", position: "sticky", left: 0, background: "inherit" }}>
                                                Date
                                            </th>
                                            <th style={{ textAlign: "right", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                                                Price ({unitLabel})
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered
                                            .slice()
                                            .reverse()
                                            .map((row) => (
                                                <tr key={row.date}>
                                                    <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", left: 0, background: "var(--modal-bg, #0b0b0b)" }}>
                                                        {formatDateDense(row.date)}
                                                    </td>
                                                    <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                                        {numberFmt.format(row.value)}
                                                    </td>
                                                </tr>
                                            ))}
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={2} style={{ padding: 12, opacity: 0.8 }}>
                                                    No rows to display
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </ModalShell>
    );
}