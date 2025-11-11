import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { readStrategyPointer } from "@/lib/strategy-pointer";
import { slugifyStrategyName } from "@/lib/slug";

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
  const strategy = await resolveStrategyFromDatabase(identifier, ownerId);
  if (strategy) return strategy;

  return resolveStrategyFromPointer(identifier);
}

async function resolveStrategyFromDatabase(
  identifier: string,
  ownerId: string | null
) {
  if (!process.env.DATABASE_URL) return null;
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
  if (!process.env.DATABASE_URL) return;
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

async function resolveStrategyFromPointer(identifier: string) {
  const pointer = await readPointerByIdentifier(identifier);
  if (!pointer) return null;
  return {
    id: pointer.slug,
    slug: pointer.slug,
    name: pointer.name ?? pointer.slug,
    latestVersion: {
      id: pointer.versionTag,
      versionTag: pointer.versionTag,
      s3Key: pointer.s3Key,
    },
  };
}

async function readPointerByIdentifier(identifier: string) {
  const candidates = Array.from(
    new Set([
      identifier,
      identifier.toLowerCase(),
      slugifyStrategyName(identifier),
    ])
  ).filter(Boolean);

  for (const candidate of candidates) {
    const pointer = await readStrategyPointer(candidate);
    if (pointer) return pointer;
  }
  return null;
}
