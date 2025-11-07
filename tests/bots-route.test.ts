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
    type ResponseBody = { bots: Array<{ id: string; strategy?: { slug: string } | null }> };
    const json: ResponseBody = await res.json();
    expect(json.bots).toHaveLength(1);
    expect(json.bots[0]).toMatchObject({
      id: "bot_seed_001",
      strategy: { slug: "rsi-band" },
      logTail: null,
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
