// lib/authz.ts
import type { Session } from "next-auth";
import { Role as PrismaRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export type Role = "researcher" | "botOperator";

const ROLE_ENV_VARS: Record<Role, string | undefined> = {
  researcher: process.env.AUTH_RESEARCHERS,
  botOperator: process.env.AUTH_BOT_OPERATORS,
};

const FALLBACK_ALLOW_ALL = process.env.AUTH_ALLOW_ALL === "true";
const WILDCARD = "*";
const CACHE_TTL_MS = 60_000;
const DB_ENABLED = () => Boolean(process.env.DATABASE_URL);

const roleAssignments: Record<Role, string[]> = {
  researcher: parseList(ROLE_ENV_VARS.researcher),
  botOperator: parseList(ROLE_ENV_VARS.botOperator),
};

const ADMIN_IMPLIED: Role[] = ["researcher", "botOperator"];
type CacheEntry = { roles: Set<Role>; expires: number };
const roleCache = new Map<string, CacheEntry>();

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

async function rolesFromDatabase(userId: string): Promise<Set<Role>> {
  const cacheKey = userId.toLowerCase();
  const cached = roleCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return new Set(cached.roles);
  }

  const assignments = await prisma.roleAssignment.findMany({
    where: { userId },
    select: { role: true },
  });
  const roles = new Set<Role>();
  for (const item of assignments) {
    mapDbRole(item.role).forEach((r) => roles.add(r));
  }
  roleCache.set(cacheKey, { roles, expires: Date.now() + CACHE_TTL_MS });
  return roles;
}

function mapDbRole(role: PrismaRole): Role[] {
  if (role === "RESEARCHER") return ["researcher"];
  if (role === "BOT_OPERATOR") return ["botOperator"];
  if (role === "ADMIN") return ADMIN_IMPLIED;
  return [];
}

function rolesFromEnv(session: Session | null): Set<Role> {
  const identifiers = userIdentifiers(session);
  const resolved = new Set<Role>();
  (Object.keys(roleAssignments) as Role[]).forEach((role) => {
    const configured = roleAssignments[role];
    if (!configured.length) return;
    if (configured.includes(WILDCARD)) {
      resolved.add(role);
      return;
    }
    if (configured.some((entry) => identifiers.has(entry))) {
      resolved.add(role);
    }
  });
  return resolved;
}

async function resolveRoles(session: Session | null): Promise<Set<Role>> {
  if (!session?.user) return new Set();
  if (FALLBACK_ALLOW_ALL) {
    return new Set<Role>(["researcher", "botOperator"]);
  }

  const resolved = rolesFromEnv(session);
  const userId = getSessionUserId(session);

  if (userId && DB_ENABLED()) {
    const dbRoles = await rolesFromDatabase(userId);
    dbRoles.forEach((role) => resolved.add(role));
  }

  return resolved;
}

export async function hasRole(
  session: Session | null,
  role: Role
): Promise<boolean> {
  if (!session?.user) return false;
  const roles = await resolveRoles(session);
  return roles.has(role);
}

export async function requireRole(session: Session | null, role: Role) {
  if (!session?.user) {
    return { ok: false as const, response: unauthorizedResponse() };
  }
  if (await hasRole(session, role)) {
    return { ok: true as const };
  }
  return { ok: false as const, response: forbiddenResponse(role) };
}

export async function requireAnyRole(session: Session | null, roles: Role[]) {
  if (!session?.user) {
    return { ok: false as const, response: unauthorizedResponse() };
  }
  const resolved = await resolveRoles(session);
  if (roles.some((role) => resolved.has(role))) {
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
