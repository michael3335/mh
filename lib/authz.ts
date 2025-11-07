// lib/authz.ts
import type { Session } from "next-auth";

export type Role = "researcher" | "botOperator";

const ROLE_ENV_VARS: Record<Role, string | undefined> = {
  researcher: process.env.AUTH_RESEARCHERS,
  botOperator: process.env.AUTH_BOT_OPERATORS,
};

const FALLBACK_ALLOW_ALL = process.env.AUTH_ALLOW_ALL === "true";
const WILDCARD = "*";

const roleAssignments: Record<Role, string[]> = {
  researcher: parseList(ROLE_ENV_VARS.researcher),
  botOperator: parseList(ROLE_ENV_VARS.botOperator),
};

function parseList(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
  });
}

function forbiddenResponse(role: Role | string) {
  return new Response(
    JSON.stringify({ error: `Forbidden (${role})` }),
    { status: 403 }
  );
}

function userIdentifiers(session: Session | null): Set<string> {
  if (!session?.user) return new Set();
  const identifiers = new Set<string>();

  const rawEmail = session.user.email?.toLowerCase();
  if (rawEmail) identifiers.add(rawEmail);

  const rawName = session.user.name?.toLowerCase();
  if (rawName) identifiers.add(rawName);

  const rawId = (session.user as { id?: string })?.id?.toLowerCase();
  if (rawId) identifiers.add(rawId);

  return identifiers;
}

export function hasRole(session: Session | null, role: Role): boolean {
  if (!session?.user) return false;
  if (FALLBACK_ALLOW_ALL) return true;

  const configured = roleAssignments[role];
  if (!configured.length) return false;
  if (configured.includes(WILDCARD)) return true;

  const identifiers = userIdentifiers(session);
  return configured.some((entry) => identifiers.has(entry));
}

export function requireRole(session: Session | null, role: Role) {
  if (!session?.user) {
    return { ok: false as const, response: unauthorizedResponse() };
  }
  if (hasRole(session, role)) {
    return { ok: true as const };
  }
  return { ok: false as const, response: forbiddenResponse(role) };
}

export function requireAnyRole(session: Session | null, roles: Role[]) {
  if (!session?.user) {
    return { ok: false as const, response: unauthorizedResponse() };
  }
  if (roles.some((role) => hasRole(session, role))) {
    return { ok: true as const };
  }
  return {
    ok: false as const,
    response: forbiddenResponse(roles.join(",")),
  };
}

export function roleConfigSnapshot(): Record<Role, string[]> {
  return {
    researcher: [...roleAssignments.researcher],
    botOperator: [...roleAssignments.botOperator],
  };
}
