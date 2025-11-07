import { describe, expect, it, beforeEach, afterAll, vi } from "vitest";

const { roleFindManyMock, prismaMock } = vi.hoisted(() => {
  const roleFindManyMock = vi.fn();
  return {
    roleFindManyMock,
    prismaMock: {
      roleAssignment: {
        findMany: roleFindManyMock,
      },
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

type SessionLike = {
  user?: {
    email?: string | null;
    name?: string | null;
    id?: string;
  };
};

const ORIGINAL_ENV = { ...process.env };

function makeSession(overrides: SessionLike["user"] = {}): SessionLike {
  return {
    user: {
      email: "user@example.com",
      name: "User Example",
      id: "123",
      ...overrides,
    },
  };
}

async function loadAuthz() {
  // Ensure module reads the latest env snapshot.
  vi.resetModules();
  return import("../lib/authz");
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AUTH_RESEARCHERS;
  delete process.env.AUTH_BOT_OPERATORS;
  delete process.env.AUTH_ALLOW_ALL;
  delete process.env.DATABASE_URL;
  roleFindManyMock.mockReset();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("authz role helpers", () => {
  it("returns 401 when no session is present", async () => {
    process.env.AUTH_RESEARCHERS = "user@example.com";
    const { requireRole } = await loadAuthz();
    const result = await requireRole(null, "researcher");
    expect(result.ok).toBe(false);
    expect(result.response.status).toBe(401);
  });

  it("allows configured researcher email", async () => {
    process.env.AUTH_RESEARCHERS = "user@example.com";
    const { requireRole } = await loadAuthz();
    const result = await requireRole(makeSession(), "researcher");
    expect(result.ok).toBe(true);
  });

  it("denies when user is missing required role", async () => {
    process.env.AUTH_RESEARCHERS = "someoneelse@example.com";
    const { requireRole } = await loadAuthz();
    const session = makeSession();
    const result = await requireRole(session, "researcher");
    expect(result.ok).toBe(false);
    expect(result.response.status).toBe(403);
  });

  it("supports wildcard roles via '*'", async () => {
    process.env.AUTH_RESEARCHERS = "*";
    const { requireRole } = await loadAuthz();
    const result = await requireRole(makeSession(), "researcher");
    expect(result.ok).toBe(true);
  });

  it("requireAnyRole allows when at least one role matches", async () => {
    process.env.AUTH_RESEARCHERS = "user@example.com";
    process.env.AUTH_BOT_OPERATORS = "ops@example.com";
    const { requireAnyRole } = await loadAuthz();
    const result = await requireAnyRole(makeSession(), [
      "botOperator",
      "researcher",
    ]);
    expect(result.ok).toBe(true);
  });

  it("pulls role assignments from Postgres when DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgres://test";
    roleFindManyMock.mockResolvedValue([{ role: "RESEARCHER" }]);
    const { requireRole } = await loadAuthz();
    const session = makeSession({ id: "user-db" });
    const result = await requireRole(session, "researcher");
    expect(roleFindManyMock).toHaveBeenCalledWith({
      where: { userId: "user-db" },
      select: { role: true },
    });
    expect(result.ok).toBe(true);
  });

  it("treats ADMIN assignment as all roles", async () => {
    process.env.DATABASE_URL = "postgres://test";
    roleFindManyMock.mockResolvedValue([{ role: "ADMIN" }]);
    const { requireRole } = await loadAuthz();
    const result = await requireRole(makeSession(), "botOperator");
    expect(result.ok).toBe(true);
  });

  it("denies when DB roles are empty", async () => {
    process.env.DATABASE_URL = "postgres://test";
    roleFindManyMock.mockResolvedValue([]);
    const { requireRole } = await loadAuthz();
    const result = await requireRole(makeSession(), "researcher");
    expect(result.ok).toBe(false);
    expect(result.response.status).toBe(403);
  });
});
