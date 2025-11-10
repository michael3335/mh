"use client";

import ModelsShell, { useModelsContext } from "@/components/models/ModelsShell";
import type { Route } from "next";
import dynamic from "next/dynamic";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useModelApi } from "@/lib/hooks/useModelApi";

const API = "/api/models";
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DatasetSchema = z.object({
  exchange: z.string().min(1, "Select an exchange"),
  pairs: z.string().min(1, "Provide at least one pair"),
  timeframe: z.string().min(1, "Pick a timeframe"),
  from: z.string().min(1, "Start date required"),
  to: z.string().min(1, "End date required"),
});

const ParamsSchema = z.object({
  rsi_len: z.number().int().min(2).max(500),
  rsi_buy: z.number().int().min(1).max(100),
  rsi_sell: z.number().int().min(1).max(100),
});

const SaveSchema = z.object({
  name: z.string().min(1, "Strategy requires a name"),
  code: z.string().min(1, "Strategy code cannot be empty"),
});

const JobSchema = z.object({
  strategySlug: z.string().min(1),
  params: ParamsSchema,
  dataset: DatasetSchema,
});

type KPI = { cagr?: number; sharpe?: number; mdd?: number; trades?: number };
type PastRun = { id: string; status: "SUCCEEDED" | "FAILED" | "RUNNING"; startedAt: string; kpis?: KPI };
type ParamsState = { rsi_len: number; rsi_buy: number; rsi_sell: number };
const PARAM_KEYS = ["rsi_len", "rsi_buy", "rsi_sell"] as const;

type StrategyEditorContentProps = {
  strategySlug: string;
};

export default function StrategyEditorPage() {
  const params = useParams<{ id: string }>();
  const strategySlug = decodeURIComponent(params.id);
  return (
    <ModelsShell
      title="Strategy"
      unauthenticatedMessage="You must sign in to edit strategies."
      footerLinks={[
        { label: "← Back to models", href: "/models" as Route },
        { label: "← Back to home", href: "/" as Route },
      ]}
    >
      <StrategyEditorContent strategySlug={strategySlug} />
    </ModelsShell>
  );
}

function StrategyEditorContent({ strategySlug }: StrategyEditorContentProps) {
  const { status, notify } = useModelsContext();
  const router = useRouter();
  const runsRoute = "/models/runs" as Route;

  const [name, setName] = useState(strategySlug === "seed" ? "RSI_Band" : strategySlug);
  const [code, setCode] = useState<string>(
    `# ${name}
from sandbox.api import Strategy, Indicator, Signal

class ${name.replace(/[^A-Za-z0-9_]/g, "_")}(Strategy):
    params = { "rsi_len": 14, "rsi_buy": 30, "rsi_sell": 70 }
    def build(self, data):
        rsi = Indicator.rsi(data.close, self.p.rsi_len)
        self.buy_signal  = Signal.cross_under(rsi, self.p.rsi_buy)
        self.sell_signal = Signal.cross_over(rsi, self.p.rsi_sell)
`
  );

  const [paramsState, setParamsState] = useState<ParamsState>({ rsi_len: 14, rsi_buy: 30, rsi_sell: 70 });
  const [dataset, setDataset] = useState({ exchange: "binance", pairs: "BTC/USDT,ETH/USDT", timeframe: "1h", from: "2022-01-01", to: "2025-01-01" });
  const [loading, setLoading] = useState(false);
  const enabled = status === "authenticated";
  const { data: runsData, error: runsError } = useModelApi<PastRun[]>(
    enabled ? `${API}/strategies/${encodeURIComponent(strategySlug)}/runs` : null,
    {
      enabled,
      parser: async (res) => {
        const payload = await res.json().catch(() => ({ runs: [] }));
        return (payload?.runs ?? []) as PastRun[];
      },
    }
  );
  const runs = runsData ?? [];
  const [formError, setFormError] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  const save = useCallback(async () => {
    const validated = SaveSchema.safeParse({ name, code });
    if (!validated.success) {
      setFormError(validated.error.issues[0]?.message ?? "Name and code are required");
      return;
    }
    setFormError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/strategies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(payload?.error ?? "Save failed");
        notify({ tone: "error", message: payload?.error ?? "Save failed" });
        return;
      }
      const nextSlug = typeof payload?.slug === "string" ? payload.slug : strategySlug;
      notify({ tone: "success", message: "Strategy saved" });
      if (nextSlug && nextSlug !== strategySlug) {
        router.replace(`/models/strategies/${encodeURIComponent(nextSlug)}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setFormError(message);
      notify({ tone: "error", message });
    } finally {
      setLoading(false);
    }
  }, [name, code, router, strategySlug, notify]);

  const launch = useCallback(async (kind: "backtest" | "grid" | "walkforward") => {
    const validated = JobSchema.safeParse({ strategySlug, params: paramsState, dataset });
    if (!validated.success) {
      setJobError(validated.error.issues[0]?.message ?? "Invalid job payload");
      return;
    }
    setJobError(null);
    setLoading(true);
    try {
      const payload = {
        strategy: name,
        strategySlug,
        params: validated.data.params,
        dataset: validated.data.dataset,
      };
      const endpoint = kind === "backtest"
        ? `${API}/jobs/backtest`
        : kind === "grid"
          ? `${API}/jobs/grid`
          : `${API}/jobs/walkforward`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setJobError(body?.error ?? "Failed to enqueue job");
        notify({ tone: "error", message: body?.error ?? "Failed to enqueue job" });
        return;
      }
      notify({ tone: "success", message: "Job enqueued" });
      const jobId = body?.jobId;
      const href = jobId
        ? (`/models/runs?focus=${encodeURIComponent(String(jobId))}` as Route)
        : runsRoute;
      router.push(href);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to enqueue job";
      setJobError(message);
      notify({ tone: "error", message });
    } finally {
      setLoading(false);
    }
  }, [strategySlug, name, paramsState, dataset, router, runsRoute, notify]);

  const canSave = useMemo(() => name.trim().length > 0 && code.trim().length > 0, [name, code]);

  const control: CSSProperties = {
    width: "100%",
    padding: "0.6rem 0.75rem",
    border: "1px solid rgba(0,0,0,.28)",
    borderRadius: 10,
    background: "#fff",
    color: "#111",
    lineHeight: 1.2,
    minHeight: 40,
  };
  const panel: CSSProperties = {
    border: "1px solid rgba(0,0,0,.12)",
    borderRadius: 12,
    background: "#fff",
    color: "#111",
    boxShadow: "0 2px 10px rgba(0,0,0,.12)",
  };
  const chip: CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,.06)",
    color: "#111",
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => { setName(e.target.value); setFormError(null); }} placeholder="Strategy name" style={{ ...control, maxWidth: 260, fontWeight: 700 }} />
        <button
          onClick={save}
          disabled={!canSave || loading}
          style={{ padding: "0.65rem 1rem", borderRadius: 10, border: "none", background: "#fff", color: "#111", fontWeight: 900, cursor: "pointer", minHeight: 40, opacity: !canSave || loading ? 0.6 : 1, boxShadow: "0 2px 10px rgba(0,0,0,.18)" }}
        >
          Save
        </button>
        {(["backtest", "grid", "walkforward"] as const).map((k) => (
          <button
            key={k}
            onClick={() => launch(k)}
            disabled={loading}
            style={{ padding: "0.65rem 1rem", borderRadius: 10, border: "1px solid rgba(255,255,255,.4)", background: "transparent", color: "#fff", cursor: "pointer", minHeight: 40, opacity: loading ? 0.6 : 1 }}
          >
            {k === "backtest" ? "Run Backtest" : k === "grid" ? "Grid Search" : "Walk-Forward"}
          </button>
        ))}
      </div>

      {(formError || jobError) && (
        <div style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.4)", borderRadius: 12, padding: "0.6rem 0.9rem", color: "#fee2e2", fontSize: 13 }}>
          {formError && <div>Save error: {formError}</div>}
          {jobError && <div>Job error: {jobError}</div>}
        </div>
      )}
      {runsError && (
        <div style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.4)", borderRadius: 12, padding: "0.6rem 0.9rem", color: "#fee2e2", fontSize: 13 }}>
          {runsError}
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        <div style={{ ...panel, overflow: "hidden" }}>
          <div style={{ textAlign: "right", padding: "6px 10px", ...chip, background: "rgba(0,0,0,.08)" }}>Python API</div>
          <div style={{ height: 520 }}>
            <MonacoEditor
              height="520px"
              language="python"
              theme="vs-dark"
              value={code}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
              onChange={(value) => {
                setCode(value ?? "");
                setFormError(null);
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ ...panel, padding: "1rem" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Parameters</div>
            <div style={{ display: "grid", gap: 10 }}>
              {PARAM_KEYS.map((key) => (
                <label key={key} style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#6b7280", textTransform: "uppercase" }}>
                    {key.replace("_", " ")}
                  </div>
                  <input
                    type="number"
                    value={paramsState[key]}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setParamsState((prev) => ({ ...prev, [key]: value }));
                      setJobError(null);
                    }}
                    style={control}
                  />
                </label>
              ))}
            </div>
          </div>

          <div style={{ ...panel, padding: "1rem" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Dataset</div>
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#6b7280", textTransform: "uppercase" }}>Exchange</div>
                <input value={dataset.exchange} onChange={(e) => {
                  setDataset((d) => ({ ...d, exchange: e.target.value }));
                  setJobError(null);
                }} style={control} />
              </label>
              <label style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#6b7280", textTransform: "uppercase" }}>Pairs</div>
                <input value={dataset.pairs} onChange={(e) => {
                  setDataset((d) => ({ ...d, pairs: e.target.value }));
                  setJobError(null);
                }} style={control} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                <label style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#6b7280", textTransform: "uppercase" }}>Timeframe</div>
                  <input value={dataset.timeframe} onChange={(e) => {
                    setDataset((d) => ({ ...d, timeframe: e.target.value }));
                    setJobError(null);
                  }} style={control} />
                </label>
                <label style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#6b7280", textTransform: "uppercase" }}>From</div>
                  <input type="date" value={dataset.from} onChange={(e) => {
                    setDataset((d) => ({ ...d, from: e.target.value }));
                    setJobError(null);
                  }} style={control} />
                </label>
                <label style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#6b7280", textTransform: "uppercase" }}>To</div>
                  <input type="date" value={dataset.to} onChange={(e) => {
                    setDataset((d) => ({ ...d, to: e.target.value }));
                    setJobError(null);
                  }} style={control} />
                </label>
              </div>
            </div>
          </div>

          <div style={{ ...panel, padding: "1rem" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Recent Runs</div>
            <div style={{ display: "grid", gap: 10, textAlign: "left" }}>
              {runs.map((r) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{r.id}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{new Date(r.startedAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ ...chip, background: r.status === "SUCCEEDED" ? "rgba(16,185,129,.2)" : r.status === "FAILED" ? "rgba(239,68,68,.25)" : "rgba(59,130,246,.25)" }}>
                      {r.status}
                    </div>
                    {r.kpis && (
                      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
                        {r.kpis.cagr != null ? `CAGR ${(r.kpis.cagr * 100).toFixed(1)}%` : ""}
                        {r.kpis.sharpe != null ? ` · Sharpe ${r.kpis.sharpe.toFixed(2)}` : ""}
                        {r.kpis.mdd != null ? ` · MDD ${(r.kpis.mdd * 100).toFixed(1)}%` : ""}
                        {r.kpis.trades != null ? ` · Trades ${r.kpis.trades}` : ""}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!runs.length && <div style={{ opacity: 0.85 }}>No runs yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
