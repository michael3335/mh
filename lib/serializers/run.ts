import type {
  Prisma,
  Run,
  RunKind,
  RunStatus,
  Strategy,
} from "@prisma/client";

export type KPIs = {
  cagr?: number | null;
  mdd?: number;
  sharpe?: number | null;
  trades?: number;
};

export type RunRow = {
  id: string;
  strategyName: string;
  kind: "backtest" | "grid" | "walkforward";
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  startedAt: string;
  finishedAt?: string | null;
  kpis?: KPIs;
};

type RunWithStrategy = Run & {
  strategy?: Pick<Strategy, "name"> | null;
};

export function mapRunRow(run: RunWithStrategy): RunRow {
  return {
    id: run.id,
    strategyName: run.strategy?.name ?? "unknown",
    kind: mapKind(run.kind),
    status: mapStatus(run.status),
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    kpis: extractKpis(run.kpis),
  };
}

function mapKind(kind: RunKind): RunRow["kind"] {
  switch (kind) {
    case "GRID":
      return "grid";
    case "WALKFORWARD":
      return "walkforward";
    case "BACKTEST":
    default:
      return "backtest";
  }
}

function mapStatus(status: RunStatus): RunRow["status"] {
  switch (status) {
    case "FAILED":
      return "FAILED";
    case "RUNNING":
      return "RUNNING";
    case "QUEUED":
      return "QUEUED";
    case "SUCCEEDED":
    default:
      return "SUCCEEDED";
  }
}

function extractKpis(value: Prisma.JsonValue | null | undefined): KPIs {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;

  const num = (key: string): number | undefined => {
    const v = record[key];
    return typeof v === "number" ? v : undefined;
  };

  return {
    cagr: num("cagr") ?? null,
    mdd: num("mdd") ?? num("maxDD"),
    sharpe: num("sharpe") ?? null,
    trades: num("trades"),
  };
}
