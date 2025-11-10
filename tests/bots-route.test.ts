import { describe, beforeEach, expect, it, vi } from "vitest";

const { botFindManyMock, prismaMock, s3SendMock, notFoundError } = vi.hoisted(() => {
  const botFindManyMock = vi.fn();
  const s3SendMock = vi.fn();
  const notFoundError = Object.assign(new Error("NotFound"), {
    $metadata: { httpStatusCode: 404 },
  });
  return {
    botFindManyMock,
    s3SendMock,
    notFoundError,
    prismaMock: {
      strategy: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      strategyVersion: {
        create: vi.fn(),
      },
      run: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      bot: {
        findMany: botFindManyMock,
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      promotion: {
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      roleAssignment: {
        findFirst: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/s3", () => ({
  s3: { send: s3SendMock },
  BUCKET: "test-bucket",
}));

vi.mock("@/lib/authz", () => ({
  requireRole: async () => ({ ok: true }),
  requireAnyRole: async () => ({ ok: true }),
}));

vi.mock("next-auth", () => ({
  getServerSession: () => Promise.resolve({ user: { id: "user-123" } }),
}));

import { GET } from "@/app/api/models/bots/route";

type ResponseBody = {
  bots: Array<{
    id: string;
    strategy?: { slug: string } | null;
    state?: Record<string, unknown> | null;
    logTail?: string | null;
    lastPromotion?: {
      id: string;
      status: string;
      target: string;
      runId?: string | null;
    } | null;
  }>;
};

describe("GET /api/models/bots", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://test";
    botFindManyMock.mockReset();
    s3SendMock.mockReset();
    s3SendMock.mockRejectedValue(notFoundError);
    prismaMock.promotion.findMany.mockResolvedValue([]);
  });

  it("returns bots from the database when configured", async () => {
    botFindManyMock.mockResolvedValue([
      {
        id: "bot_seed_001",
        name: "RSI Bot",
        mode: "paper",
        status: "RUNNING",
        equity: 10000,
        dayPnl: 120,
        pairlist: ["BTC/USDT"],
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        strategy: { name: "RSI Band", slug: "rsi-band" },
      },
    ]);

    const res = await GET();
    const json: ResponseBody = await res.json();
    expect(json.bots).toHaveLength(1);
    expect(json.bots[0]).toMatchObject({
      id: "bot_seed_001",
      strategy: { slug: "rsi-band" },
      logTail: null,
    });
  });

  it("enriches bots with state, log tail, and last promotion data", async () => {
    const statePayload = { uptimeSeconds: 42, version: "1.0.0" };
    const logText = "status=RUNNING\nheartbeat ok\n";

    botFindManyMock.mockResolvedValue([
      {
        id: "bot_seed_002",
        name: "Momentum Bot",
        mode: "live",
        status: "RUNNING",
        equity: 15000,
        dayPnl: 250,
        pairlist: ["ETH/USDT"],
        updatedAt: new Date("2024-02-01T00:00:00Z"),
        strategy: { name: "Momentum", slug: "momentum" },
      },
    ]);

    prismaMock.promotion.findMany.mockResolvedValue([
      {
        id: "promo_123",
        botId: "bot_seed_002",
        status: "SUCCEEDED",
        target: "PAPER",
        runId: "run_777",
        createdAt: new Date("2024-02-02T00:00:00Z"),
      },
    ]);

    s3SendMock.mockImplementation((command: { input?: { Key?: string } }) => {
      const key = command.input?.Key;
      if (key === "bots/bot_seed_002/state.json") {
        return Promise.resolve({
          Body: {
            transformToString: () =>
              Promise.resolve(JSON.stringify(statePayload)),
          },
        });
      }
      if (key === "bots/bot_seed_002/logs/latest.txt") {
        return Promise.resolve({
          Body: {
            transformToString: () => Promise.resolve(logText),
          },
        });
      }
      return Promise.reject(notFoundError);
    });

    const res = await GET();
    const json: ResponseBody = await res.json();

    expect(json.bots).toHaveLength(1);
    expect(json.bots[0].state).toEqual(statePayload);
    expect(json.bots[0].logTail).toBe(logText);
    expect(json.bots[0].lastPromotion).toMatchObject({
      id: "promo_123",
      status: "SUCCEEDED",
      target: "PAPER",
      runId: "run_777",
    });
  });

  it("returns 500 when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("DATABASE_URL not configured");
    expect(botFindManyMock).not.toHaveBeenCalled();
  });
});
