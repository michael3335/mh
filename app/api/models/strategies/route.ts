// app/api/models/strategies/route.ts
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { putText, BUCKET } from "@/lib/s3";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type StrategySummary = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  updatedAt: string;
  latestVersion?: {
    id: string;
    versionTag: string;
    s3Key: string;
  } | null;
};

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

export async function GET() {
  const session = await getServerSession(authOptions);
  const authz = await requireRole(session, "researcher");
  if (!authz.ok) return authz.response;

  if (!hasDatabase()) {
    return Response.json({ strategies: [] });
  }

  try {
    const userId = getSessionUserId(session);
    const strategies = await prisma.strategy.findMany({
      where: userId ? { ownerId: userId } : undefined,
      include: {
        latestVersion: {
          select: { id: true, versionTag: true, s3Key: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return Response.json({
      strategies: strategies.map<StrategySummary>((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        updatedAt: s.updatedAt.toISOString(),
        latestVersion: s.latestVersion
          ? {
              id: s.latestVersion.id,
              versionTag: s.latestVersion.versionTag,
              s3Key: s.latestVersion.s3Key,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/models/strategies failed:", error);
    return Response.json(
      { error: "ListStrategiesFailed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authz = await requireRole(session, "researcher");
  if (!authz.ok) return authz.response;

  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const code = typeof body?.code === "string" ? body.code : "";
    const description =
      typeof body?.description === "string" ? body.description : undefined;
    const manifest =
      typeof body?.manifest === "object" && body?.manifest !== null
        ? body.manifest
        : defaultManifest(name);

    if (!name || !code) {
      return Response.json(
        { error: "Missing 'name' or 'code'" },
        { status: 400 }
      );
    }

    const ownerId = getSessionUserId(session);
    if (hasDatabase() && !ownerId) {
      return Response.json(
        { error: "Missing user identifier for strategy owner" },
        { status: 400 }
      );
    }

    const versionTag =
      typeof body?.version === "string" && body.version.trim().length
        ? body.version.trim()
        : `v${Date.now()}`;

    const { slug, strategyForOwner } = hasDatabase() && ownerId
      ? await ensureStrategySlug(name, ownerId)
      : { slug: slugify(name), strategyForOwner: null };

    const prefix = `strategies/${slug}/${versionTag}`;
    await putText(`${prefix}/main.py`, code, "text/x-python");
    await putText(
      `${prefix}/manifest.json`,
      JSON.stringify(manifest, null, 2),
      "application/json"
    );

    let strategyId: string | null = strategyForOwner?.id ?? null;
    let versionId: string | null = null;

    if (hasDatabase() && ownerId) {
      strategyId = await upsertStrategyRecord({
        strategyId: strategyForOwner?.id ?? null,
        ownerId,
        slug,
        name,
        description,
        manifest,
      });

      const version = await prisma.strategyVersion.create({
        data: {
          strategyId,
          versionTag,
          s3Key: `${prefix}/main.py`,
          manifest,
          createdById: ownerId,
        },
      });
      versionId = version.id;

      await prisma.strategy.update({
        where: { id: strategyId },
        data: {
          latestVersionId: version.id,
          manifest,
        },
      });
    }

    return Response.json(
      {
        ok: true,
        slug,
        versionTag,
        strategyId,
        versionId,
        key: `${prefix}/main.py`,
        bucket: BUCKET,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/models/strategies failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "InternalError", message }, { status: 500 });
  }
}

function defaultManifest(name: string) {
  return {
    name,
    version: "dev",
    params: [
      { key: "rsi_len", label: "RSI Length", type: "int", default: 14 },
      { key: "rsi_buy", label: "RSI Buy", type: "int", default: 30 },
      { key: "rsi_sell", label: "RSI Sell", type: "int", default: 70 },
    ],
    entrypoint: "main.py",
  };
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return base || `strategy-${randomUUID().slice(0, 8)}`;
}

async function ensureStrategySlug(name: string, ownerId: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let existing = await prisma.strategy.findUnique({ where: { slug } });
  let attempts = 0;

  while (existing && existing.ownerId !== ownerId && attempts < 5) {
    slug = `${baseSlug}-${randomUUID().slice(0, 4)}`;
    existing = await prisma.strategy.findUnique({ where: { slug } });
    attempts += 1;
  }

  return { slug, strategyForOwner: existing?.ownerId === ownerId ? existing : null };
}

async function upsertStrategyRecord(params: {
  strategyId: string | null;
  ownerId: string;
  slug: string;
  name: string;
  description?: string;
  manifest: unknown;
}) {
  const { strategyId, ownerId, slug, name, description, manifest } = params;

  if (strategyId) {
    const updated = await prisma.strategy.update({
      where: { id: strategyId },
      data: {
        name,
        description,
        manifest: manifest as Prisma.InputJsonValue,
      },
    });
    return updated.id;
  }

  const created = await prisma.strategy.create({
    data: {
      slug,
      name,
      description,
      ownerId,
      manifest: manifest as Prisma.InputJsonValue,
    },
  });
  return created.id;
}
