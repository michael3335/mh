import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const DatasetInputSchema = z.object({
  exchange: z.string().min(1),
  pairs: z.string().min(1),
  timeframe: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
});

export type DatasetInput = z.infer<typeof DatasetInputSchema>;

export type DatasetSpec = {
  exchange: string;
  pair: string;
  timeframe: string;
  start: string;
  end: string;
};

export function normalizeDataset(input: DatasetInput): DatasetSpec {
  const pair =
    input.pairs
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)[0] ?? input.pairs.trim();

  return {
    exchange: input.exchange,
    pair,
    timeframe: input.timeframe,
    start: input.from,
    end: input.to,
  };
}

export async function resolveStrategyForOwner(
  identifier: string,
  ownerId: string | null
) {
  const where = ownerId
    ? {
        ownerId,
        OR: [{ id: identifier }, { slug: identifier }, { name: identifier }],
      }
    : { OR: [{ id: identifier }, { slug: identifier }, { name: identifier }] };

  return prisma.strategy.findFirst({
    where,
    include: { latestVersion: true },
  });
}

type RunKind = "BACKTEST" | "GRID" | "WALKFORWARD";

export async function recordQueuedRun(params: {
  runId: string;
  strategyId: string;
  ownerId?: string | null;
  artifactPrefix: string;
  kind: RunKind;
  spec: DatasetSpec;
  params?: Record<string, unknown>;
}) {
  const { runId, strategyId, ownerId, artifactPrefix, kind, spec, params: inputParams } =
    params;
  await prisma.run.upsert({
    where: { id: runId },
    update: {
      strategyId,
      ownerId: ownerId ?? undefined,
      kind,
      status: "QUEUED",
      artifactPrefix,
      spec: spec as Prisma.InputJsonValue,
      params: (inputParams ?? {}) as Prisma.InputJsonValue,
      kpis: Prisma.JsonNull,
    },
    create: {
      id: runId,
      strategyId,
      ownerId: ownerId ?? undefined,
      kind,
      status: "QUEUED",
      artifactPrefix,
      spec: spec as Prisma.InputJsonValue,
      params: (inputParams ?? {}) as Prisma.InputJsonValue,
    },
  });
}
