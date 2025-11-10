"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { HistoryChart } from "@/components/HistoryModal";
import type { Route } from "next";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import type { CSSProperties } from "react";
import { useModelApi } from "@/lib/hooks/useModelApi";

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
  const params = useParams<{ id: string }>();
  const runId = decodeURIComponent(params.id);

  return (
    <DashboardShell
      title={`Run ${runId}`}
      unauthenticatedMessage="You must sign in to view run details."
      footerLinks={[
        { label: "← Back to runs", href: "/models/runs" as Route },
        { label: "← Back to home", href: "/" as Route },
      ]}
    >
      <RunDetailContent runId={runId} />
    </DashboardShell>
  );
}

type RunDetailContentProps = {
  runId: string;
};

function RunDetailContent({ runId }: RunDetailContentProps) {
  const { status } = useDashboard();
  const encodedId = encodeURIComponent(runId);
  const enabled = status === "authenticated" && Boolean(runId);

  const metricsQuery = useModelApi<Metrics>(
    enabled ? `${API}/runs/${encodedId}` : null,
    { enabled }
  );

  const runKind = metricsQuery.data?.kind;
  const allowArtifacts = enabled && runKind === "backtest";

  const equityQuery = useModelApi<SeriesPoint[]>(
    enabled ? `${API}/runs/${encodedId}/artifacts/equity` : null,
    {
      enabled: allowArtifacts,
      immediate: allowArtifacts,
      parser: async (res) => {
        if (res.status === 404) return [];
        const text = await res.text();
        return csvToSeries(text);
      },
      validateResponse: (res) => {
        if (res.ok || res.status === 404) return;
        throw new Error(`Failed to load equity (${res.status})`);
      },
    }
  );

  const drawdownQuery = useModelApi<SeriesPoint[]>(
    enabled ? `${API}/runs/${encodedId}/artifacts/drawdown` : null,
    {
      enabled: allowArtifacts,
      immediate: allowArtifacts,
      parser: async (res) => {
        if (res.status === 404) return [];
        const text = await res.text();
        return csvToSeries(text);
      },
      validateResponse: (res) => {
        if (res.ok || res.status === 404) return;
        throw new Error(`Failed to load drawdown (${res.status})`);
      },
    }
  );

  const tradesQuery = useModelApi<TradeRow[]>(
    enabled ? `${API}/runs/${encodedId}/artifacts/trades` : null,
    {
      enabled: allowArtifacts,
      immediate: allowArtifacts,
      parser: async (res) => {
        if (res.status === 404) return [];
        const text = await res.text();
        return csvToTrades(text);
      },
      validateResponse: (res) => {
        if (res.ok || res.status === 404) return;
        throw new Error(`Failed to load trades (${res.status})`);
      },
    }
  );

  const metrics = metricsQuery.data;
  const artifactKindResolved = Boolean(runKind);
  const artifactUnavailable = artifactKindResolved && runKind !== "backtest";

  const equity = equityQuery.data ?? [];
  const drawdown = drawdownQuery.data ?? [];
  const trades = tradesQuery.data ?? [];
  const loading = metricsQuery.loading || equityQuery.loading || drawdownQuery.loading || tradesQuery.loading;
  const error = metricsQuery.error ?? equityQuery.error ?? drawdownQuery.error ?? tradesQuery.error;

  const kpiEntries = useMemo(() => {
    if (!metrics?.kpis) return [];
    return Object.entries(metrics.kpis)
      .map(([key, value]) => ({ key, value }))
      .filter((entry) => typeof entry.value === "number");
  }, [metrics]);

  const panel: CSSProperties = {
    background: "#fff",
    color: "#111",
    border: "1px solid rgba(0,0,0,.12)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,.12)",
  };

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
                {!artifactKindResolved ? (
                  <div style={{ color: "#111", fontSize: 14 }}>Loading run metadata…</div>
                ) : artifactUnavailable ? (
                  <div style={{ color: "#111", fontSize: 14 }}>
                    Equity curves are only generated for backtests. This run is <strong>{runKind}</strong>.
                  </div>
                ) : equityQuery.loading ? (
                  <div style={{ color: "#111", fontSize: 14 }}>Loading equity data…</div>
                ) : equity.length ? (
                  <HistoryChart data={equity} unitLabel="USD" width={480} height={280} />
                ) : (
                  <div style={{ color: "#111", fontSize: 14 }}>No equity data.</div>
                )}
              </div>
              <div style={{ ...panel, padding: "1rem" }}>
                <div style={{ fontWeight: 900, marginBottom: 8, color: "#111" }}>
                  Drawdown
                </div>
                {!artifactKindResolved ? (
                  <div style={{ color: "#111", fontSize: 14 }}>Loading run metadata…</div>
                ) : artifactUnavailable ? (
                  <div style={{ color: "#111", fontSize: 14 }}>
                    Drawdown curves are only generated for backtests. This run is <strong>{runKind}</strong>.
                  </div>
                ) : drawdownQuery.loading ? (
                  <div style={{ color: "#111", fontSize: 14 }}>Loading drawdown data…</div>
                ) : drawdown.length ? (
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
              {!artifactKindResolved ? (
                <div style={{ color: "#111" }}>Loading run metadata…</div>
              ) : artifactUnavailable ? (
                <div style={{ color: "#111" }}>
                  Trade logs are only generated for backtests. This run is <strong>{runKind}</strong>; open one of its child runs to inspect trades.
                </div>
              ) : tradesQuery.loading ? (
                <div style={{ color: "#111" }}>Loading trades…</div>
              ) : (
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
              )}
            </div>
    </>
  );
}
