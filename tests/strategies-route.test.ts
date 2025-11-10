import { describe, beforeEach, expect, it, vi } from "vitest";

type StrategiesResponse = {
  strategies: Array<{
    slug: string;
    latestVersion?: { versionTag: string } | null;
  }>;
};

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
      user: {
        upsert: vi.fn(),
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
  getServerSession: () =>
    Promise.resolve({
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "User Example",
      },
    }),
}));

const { putTextMock } = vi.hoisted(() => ({
  putTextMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/s3", () => ({
  putText: putTextMock,
  BUCKET: "test-bucket",
}));

import { GET, POST } from "@/app/api/models/strategies/route";

describe("GET /api/models/strategies", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://test";
    strategyFindManyMock.mockReset();
    prismaMock.user.upsert.mockReset();
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
    const json: StrategiesResponse = await res.json();
    expect(json.strategies).toHaveLength(1);
    expect(json.strategies[0]).toMatchObject({
      slug: "rsi-band",
      latestVersion: { versionTag: "seed" },
    });
  });

  it("returns empty list when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const res = await GET();
    const json: StrategiesResponse = await res.json();
    expect(json.strategies).toEqual([]);
    expect(strategyFindManyMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/models/strategies", () => {
  const makeRequest = (body: unknown) =>
    new Request("http://test/api/models/strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://test";
    prismaMock.strategy.findUnique.mockReset();
    prismaMock.strategy.findUnique.mockResolvedValue(null);
    prismaMock.strategy.create.mockReset();
    prismaMock.strategyVersion.create.mockReset();
    prismaMock.strategy.update.mockReset();
    prismaMock.user.upsert.mockReset();
    prismaMock.strategy.create.mockResolvedValue({
      id: "str_123",
      slug: "test-strategy",
      name: "Test Strategy",
      ownerId: "user-123",
      manifest: null,
      description: null,
    });
    prismaMock.strategyVersion.create.mockResolvedValue({
      id: "ver_123",
    });
    prismaMock.strategy.update.mockResolvedValue({});
  });

  it("upserts the user record before creating strategy data", async () => {
    const res = await POST(
      makeRequest({ name: "Test Strategy", code: "print('hi')" })
    );
    expect(res.status).toBe(201);
    expect(prismaMock.user.upsert).toHaveBeenCalledWith({
      where: { id: "user-123" },
      update: { email: "user@example.com", name: "User Example" },
      create: {
        id: "user-123",
        email: "user@example.com",
        name: "User Example",
      },
    });
  });
});
