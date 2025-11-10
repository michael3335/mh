import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function buildDatasourceUrl(): string | undefined {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;
  try {
    const url = new URL(base);
    const limit =
      process.env.PRISMA_CONNECTION_LIMIT ??
      url.searchParams.get("connection_limit") ??
      "1";
    const timeout =
      process.env.PRISMA_POOL_TIMEOUT ??
      url.searchParams.get("pool_timeout") ??
      "30";
    url.searchParams.set("connection_limit", limit);
    url.searchParams.set("pool_timeout", timeout);
    return url.toString();
  } catch {
    return base;
  }
}

const datasourceUrl = buildDatasourceUrl();

export const prisma =
  global.prismaGlobal ??
  new PrismaClient({
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}
