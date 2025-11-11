import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const { readStrategyPointerMock, prismaMock } = vi.hoisted(() => {
  return {
    readStrategyPointerMock: vi.fn(),
    prismaMock: {
      strategy: {
        findFirst: vi.fn(),
      },
      run: {
        upsert: vi.fn(),
      },
    },
  };
});

const prismaFindFirstMock = prismaMock.strategy.findFirst;
const prismaRunUpsertMock = prismaMock.run.upsert;

vi.mock("@/lib/strategy-pointer", () => ({
  readStrategyPointer: readStrategyPointerMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  recordQueuedRun,
  resolveStrategyForOwner,
} from "@/app/api/models/jobs/helpers";

const ORIGINAL_DB_URL = process.env.DATABASE_URL;

describe("job helpers", () => {
  beforeEach(() => {
    readStrategyPointerMock.mockReset();
    prismaFindFirstMock.mockReset();
    prismaRunUpsertMock.mockReset();
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (ORIGINAL_DB_URL) {
      process.env.DATABASE_URL = ORIGINAL_DB_URL;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it("resolves strategies via S3 pointer when DATABASE_URL is missing", async () => {
    readStrategyPointerMock.mockResolvedValue({
      slug: "rsi-band",
      versionTag: "dev",
      s3Key: "strategies/rsi-band/dev/main.py",
      manifest: {},
      name: "RSI Band",
      updatedAt: new Date().toISOString(),
    });

    const strategy = await resolveStrategyForOwner("rsi-band", null);

    expect(prismaFindFirstMock).not.toHaveBeenCalled();
    expect(strategy?.id).toBe("rsi-band");
    expect(strategy?.latestVersion?.s3Key).toBe(
      "strategies/rsi-band/dev/main.py"
    );
  });

  it("skips recordQueuedRun when DATABASE_URL is not configured", async () => {
    await recordQueuedRun({
      runId: "r_seed",
      strategyId: "rsi-band",
      artifactPrefix: "runs/r_seed/",
      kind: "BACKTEST",
      spec: {
        exchange: "binance",
        pair: "BTC/USDT",
        timeframe: "1h",
        start: "2024-01-01",
        end: "2024-02-01",
      },
    });

    expect(prismaRunUpsertMock).not.toHaveBeenCalled();
  });
});
