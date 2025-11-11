import { randomUUID } from "node:crypto";

export function slugifyStrategyName(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return base || `strategy-${randomUUID().slice(0, 8)}`;
}
