// lib/contracts.ts
import { z } from "zod";

export const RunKind = z.enum(["backtest", "grid", "walkforward"]);
export type RunKind = z.infer<typeof RunKind>;

export const ParamSpec = z.object({
  key: z.string(), // "rsi_period"
  label: z.string(),
  type: z.enum(["int", "float", "bool", "enum"]),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  options: z.array(z.string()).optional(), // for enum
  default: z.any().optional(),
});
export type ParamSpec = z.infer<typeof ParamSpec>;

const FreqtradeConfig = z.object({
  strategyClass: z.string(),
  stakeCurrency: z.string().default("USDT"),
  stakeAmount: z.number().default(1000),
  startupCandleCount: z.number().default(50),
});

export const Manifest = z.object({
  name: z.string(),
  version: z.string(), // git commit or semver
  description: z.string().optional(),
  params: z.array(ParamSpec),
  entrypoint: z.string().default("main.py"), // inside zip
  freqtrade: FreqtradeConfig.optional(),
});
export type Manifest = z.infer<typeof Manifest>;
export type FreqtradeConfig = z.infer<typeof FreqtradeConfig>;

export const MetricsJson = z.object({
  runId: z.string(),
  strategyId: z.string(),
  kind: RunKind,
  startedAt: z.string(),
  finishedAt: z.string(),
  params: z.record(z.string(), z.unknown()),
  kpis: z.object({
    netReturn: z.number(),
    cagr: z.number().nullable(),
    sharpe: z.number().nullable(),
    sortino: z.number().nullable(),
    maxDD: z.number(), // negative
    winRate: z.number().nullable(),
    avgTrade: z.number().nullable(),
    trades: z.number(),
  }),
  spec: z.object({
    exchange: z.string(),
    pair: z.string(),
    timeframe: z.string(),
    start: z.string(),
    end: z.string(),
  }),
});
export type MetricsJson = z.infer<typeof MetricsJson>;

export const ResearchJob = z.object({
  runId: z.string(),
  strategyId: z.string(),
  manifestS3Key: z.string(),
  artifactPrefix: z.string(),
  kind: RunKind,
  grid: z.array(z.record(z.string(), z.unknown())).optional(),
  params: z.record(z.string(), z.unknown()).optional(), // <— add this
  spec: MetricsJson.shape.spec,
  ownerId: z.string().optional(),
});
export type ResearchJob = z.infer<typeof ResearchJob>;

export const PromoteJob = z.object({
  botId: z.string(),
  runId: z.string(),
  strategyId: z.string(),
  artifactPrefix: z.string(), // runs/{runId}/
  target: z.enum(["paper", "live"]),
});
export type PromoteJob = z.infer<typeof PromoteJob>;
