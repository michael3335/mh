import { describe, beforeEach, expect, it, vi } from "vitest";

const { strategyFindManyMock, prismaMock } = vi.hoisted(() => {
  const strategyFindManyMock = vi.fn();
  return {
    strategyFindManyMock,
    prismaMock: {
      strategy: {
        findMany: strategyFindManyMock,
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
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      promotion: {
        create: vi.fn(),
        update: vi.fn(),
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

vi.mock("@/lib/authz", () => ({
  requireRole: async () => ({ ok: true }),
  requireAnyRole: async () => ({ ok: true }),
}));

vi.mock("next-auth", () => ({
  getServerSession: () => Promise.resolve({ user: { id: "user-123" } }),
}));

vi.mock("@/lib/s3", () => ({
  putText: vi.fn(),
  BUCKET: "test-bucket",
}));

import { GET } from "@/app/api/models/strategies/route";

describe("GET /api/models/strategies", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://test";
    strategyFindManyMock.mockReset();
  });

  it("returns database strategies when DB is configured", async () => {
    strategyFindManyMock.mockResolvedValue([
      {
        id: "str_1",
        slug: "rsi-band",
        name: "RSI Band",
        description: null,
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        latestVersion: {
          id: "ver_1",
          versionTag: "seed",
          s3Key: "strategies/rsi-band/seed/main.py",
        },
      },
    ]);

    const res = await GET();
    type ResponseBody = { strategies: Array<{ slug: string; latestVersion?: { versionTag: string } | null }> };
    const json: ResponseBody = await res.json();
    expect(json.strategies).toHaveLength(1);
    expect(json.strategies[0]).toMatchObject({
      slug: "rsi-band",
      latestVersion: { versionTag: "seed" },
    });
  });

  it("returns empty list when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const res = await GET();
    const json: ResponseBody = await res.json();
    expect(json.strategies).toEqual([]);
    expect(strategyFindManyMock).not.toHaveBeenCalled();
  });
});
