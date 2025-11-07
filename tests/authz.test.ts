import { describe, expect, it, beforeEach, afterAll, vi } from "vitest";

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
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("authz role helpers", () => {
  it("returns 401 when no session is present", async () => {
    process.env.AUTH_RESEARCHERS = "user@example.com";
    const { requireRole } = await loadAuthz();
    const result = requireRole(null, "researcher");
    expect(result.ok).toBe(false);
    expect(result.response.status).toBe(401);
  });

  it("allows configured researcher email", async () => {
    process.env.AUTH_RESEARCHERS = "user@example.com";
    const { requireRole } = await loadAuthz();
    const result = requireRole(makeSession(), "researcher");
    expect(result.ok).toBe(true);
  });

  it("denies when user is missing required role", async () => {
    process.env.AUTH_RESEARCHERS = "someoneelse@example.com";
    const { requireRole } = await loadAuthz();
    const session = makeSession();
    const result = requireRole(session, "researcher");
    expect(result.ok).toBe(false);
    expect(result.response.status).toBe(403);
  });

  it("supports wildcard roles via '*'", async () => {
    process.env.AUTH_RESEARCHERS = "*";
    const { requireRole } = await loadAuthz();
    const result = requireRole(makeSession(), "researcher");
    expect(result.ok).toBe(true);
  });

  it("requireAnyRole allows when at least one role matches", async () => {
    process.env.AUTH_RESEARCHERS = "user@example.com";
    process.env.AUTH_BOT_OPERATORS = "ops@example.com";
    const { requireAnyRole } = await loadAuthz();
    const result = requireAnyRole(makeSession(), [
      "botOperator",
      "researcher",
    ]);
    expect(result.ok).toBe(true);
  });
});
