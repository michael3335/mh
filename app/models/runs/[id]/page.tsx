"use client";

import ASCIIText from "@/components/ASCIIText";
import { HistoryChart } from "@/components/HistoryModal";
import type { Route } from "next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type Metrics = {
  runId: string;
  strategyId: string;
  kind: string;
  startedAt?: string;
  finishedAt?: string;
  params?: Record<string, unknown>;
  spec?: Record<string, unknown>;
  kpis?: Record<string, number>;
};

type SeriesPoint = { date: string; value: number };
type TradeRow = { entry: string; exit: string; pnl: number };

const API = "/api/models";

function csvToSeries(text: string): SeriesPoint[] {
  if (!text) return [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];
  const [, ...rows] = lines;
  return rows
    .map((line) => {
      const [timestamp, value] = line.split(",");
      const num = Number(value);
      if (!timestamp || Number.isNaN(num)) return null;
      return { date: timestamp, value: num };
    })
    .filter(Boolean) as SeriesPoint[];
}

function csvToTrades(text: string): TradeRow[] {
  if (!text) return [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];
  const header = lines[0].split(",");
  const entryIdx = header.indexOf("entry");
  const exitIdx = header.indexOf("exit");
  const pnlIdx = header.indexOf("pnl");
  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(",");
      const entry = cols[entryIdx];
      const exit = cols[exitIdx];
      const pnl = Number(cols[pnlIdx]);
      if (!entry || !exit || Number.isNaN(pnl)) return null;
      return { entry, exit, pnl };
    })
    .filter(Boolean) as TradeRow[];
}

export default function RunDetailPage() {
  const { status } = useSession();
  const params = useParams<{ id: string }>();
  const runId = decodeURIComponent(params.id);

  const routes = {
    home: "/" as Route,
    runs: "/models/runs" as Route,
    signin: "/api/auth/signin" as Route,
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [equity, setEquity] = useState<SeriesPoint[]>([]);
  const [drawdown, setDrawdown] = useState<SeriesPoint[]>([]);
  const [trades, setTrades] = useState<TradeRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const metricsRes = await fetch(
          `${API}/runs/${encodeURIComponent(runId)}`,
          { cache: "no-store" }
        );
        if (!metricsRes.ok) {
          throw new Error("Unable to load metrics");
        }
        const metricsJson = (await metricsRes.json()) as Metrics;

        const [equityRes, drawdownRes, tradesRes] = await Promise.all([
          fetch(
            `${API}/runs/${encodeURIComponent(runId)}/artifacts/equity`,
            { cache: "no-store" }
          ),
          fetch(
            `${API}/runs/${encodeURIComponent(runId)}/artifacts/drawdown`,
            { cache: "no-store" }
          ),
          fetch(
            `${API}/runs/${encodeURIComponent(runId)}/artifacts/trades`,
            { cache: "no-store" }
          ),
        ]);

        if (cancelled) return;
        const equityText = equityRes.ok ? await equityRes.text() : "";
        const drawdownText = drawdownRes.ok ? await drawdownRes.text() : "";
        const tradesText = tradesRes.ok ? await tradesRes.text() : "";

        setMetrics(metricsJson);
        setEquity(csvToSeries(equityText));
        setDrawdown(csvToSeries(drawdownText));
        setTrades(csvToTrades(tradesText));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load run");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  const kpiEntries = useMemo(() => {
    if (!metrics?.kpis) return [];
    return Object.entries(metrics.kpis)
      .map(([key, value]) => ({ key, value }))
      .filter((entry) => typeof entry.value === "number");
  }, [metrics]);

  const panel: React.CSSProperties = {
    background: "#fff",
    color: "#111",
    border: "1px solid rgba(0,0,0,.12)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,.12)",
  };

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
      <section style={{ display: "grid", gap: "1.5rem", width: "min(100%, 1080px)" }}>
        <div style={{ width: "min(90vw, 720px)", height: "clamp(80px, 20vw, 200px)", position: "relative", margin: "0 auto" }}>
          <ASCIIText text={`Run ${runId}`} enableWaves={false} interactive={false} />
        </div>

        {status === "loading" && <p>Checking access…</p>}

        {status === "unauthenticated" && (
          <>
            <p>You must sign in to view run details.</p>
            <Link
              href={routes.signin}
              style={{
                padding: "0.7rem 1.2rem",
                borderRadius: 10,
                fontWeight: 800,
                textDecoration: "none",
                background: "#fff",
                color: "#111",
                boxShadow: "0 2px 10px rgba(0,0,0,.18)",
              }}
            >
              Sign In
            </Link>
          </>
        )}

        {status === "authenticated" && (
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

            <div style={{ ...panel, padding: "1.25rem", textAlign: "left" }}>
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>
                Overview
              </div>
              {loading && <p style={{ color: "#111" }}>Loading run metadata…</p>}
              {!loading && metrics && (
                <>
                  <p style={{ color: "#111", marginBottom: 8 }}>
                    Strategy: <strong>{metrics.strategyId}</strong> · Kind:{" "}
                    <strong>{metrics.kind}</strong>
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {kpiEntries.map(({ key, value }) => (
                      <div
                        key={key}
                        style={{
                          background: "rgba(0,0,0,.05)",
                          borderRadius: 10,
                          padding: "0.75rem",
                        }}
                      >
                        <div style={{ fontSize: 11, letterSpacing: ".03em", textTransform: "uppercase", fontWeight: 700, color: "#6b7280" }}>
                          {key}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                          {Math.abs(value) >= 1
                            ? value.toFixed(2)
                            : (value * 100).toFixed(1) + "%"}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ ...panel, padding: "1rem" }}>
                <div style={{ fontWeight: 900, marginBottom: 8, color: "#111" }}>
                  Equity Curve
                </div>
                {equity.length ? (
                  <HistoryChart data={equity} unitLabel="USD" width={480} height={280} />
                ) : (
                  <div style={{ color: "#111", fontSize: 14 }}>No equity data.</div>
                )}
              </div>
              <div style={{ ...panel, padding: "1rem" }}>
                <div style={{ fontWeight: 900, marginBottom: 8, color: "#111" }}>
                  Drawdown
                </div>
                {drawdown.length ? (
                  <HistoryChart data={drawdown} unitLabel="%" width={480} height={280} />
                ) : (
                  <div style={{ color: "#111", fontSize: 14 }}>No drawdown data.</div>
                )}
              </div>
            </div>

            <div style={{ ...panel, padding: "1rem" }}>
              <div style={{ fontWeight: 900, marginBottom: 8, color: "#111", textAlign: "left" }}>
                Trades
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "#111" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,.05)", textAlign: "left" }}>
                      <th style={{ padding: "0.5rem", fontSize: 12, textTransform: "uppercase" }}>
                        Entry
                      </th>
                      <th style={{ padding: "0.5rem", fontSize: 12, textTransform: "uppercase" }}>
                        Exit
                      </th>
                      <th style={{ padding: "0.5rem", fontSize: 12, textTransform: "uppercase" }}>
                        PnL (USD)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.slice(0, 25).map((trade, idx) => (
                      <tr key={`${trade.entry}-${idx}`} style={{ borderTop: "1px solid rgba(0,0,0,.08)" }}>
                        <td style={{ padding: "0.5rem" }}>
                          {new Date(trade.entry).toLocaleString()}
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          {new Date(trade.exit).toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "0.5rem",
                            fontWeight: 700,
                            color: trade.pnl >= 0 ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {trade.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {!trades.length && (
                      <tr>
                        <td colSpan={3} style={{ padding: "0.75rem" }}>
                          No trades recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6 }}>
          <Link href={routes.runs} style={{ opacity: 0.9, textDecoration: "none", color: "#e5e7eb" }}>
            ← Back to runs
          </Link>
          <Link href={routes.home} style={{ opacity: 0.9, textDecoration: "none", color: "#e5e7eb" }}>
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
