import { prisma } from "@/lib/prisma";

export async function resolveArtifactPrefix(
  runId: string,
  ownerId?: string | null
): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null;

  try {
    const run = await prisma.run.findFirst({
      where: ownerId ? { id: runId, ownerId } : { id: runId },
      select: { artifactPrefix: true },
    });
    if (run?.artifactPrefix) {
      return run.artifactPrefix.endsWith("/")
        ? run.artifactPrefix
        : `${run.artifactPrefix}/`;
    }
  } catch (error) {
    console.warn("[run-artifacts] lookup failed", error);
  }

  return null;
}
