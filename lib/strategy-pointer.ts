import { getText, putText } from "@/lib/s3";

export type StrategyPointer = {
  slug: string;
  versionTag: string;
  s3Key: string;
  manifest: unknown;
  name?: string;
  description?: string;
  updatedAt: string;
};

export async function writeStrategyPointer(pointer: StrategyPointer) {
  const key = `strategies/${pointer.slug}/latest.json`;
  await putText(key, JSON.stringify(pointer, null, 2), "application/json");
}

export async function readStrategyPointer(
  slug: string
): Promise<StrategyPointer | null> {
  const key = `strategies/${slug}/latest.json`;
  try {
    const text = await getText(key);
    return JSON.parse(text) as StrategyPointer;
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      typeof (error as { name?: string }).name === "string"
        ? (error as { name?: string }).name
        : "";
    if (code === "NoSuchKey" || /NotFound/i.test(String(error))) {
      return null;
    }
    throw error;
  }
}
