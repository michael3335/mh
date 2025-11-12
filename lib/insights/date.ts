const displayFormatter = new Intl.DateTimeFormat("en-AU", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

function safeParse(input: string): Date | null {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseMetaDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const direct = safeParse(trimmed);
  if (direct) return direct;

  const prefixMatch = trimmed.match(DATE_PREFIX);
  if (prefixMatch) {
    const isoLike = `${prefixMatch[1]}-${prefixMatch[2]}-${prefixMatch[3]}T00:00:00`;
    const fromPrefix = safeParse(isoLike);
    if (fromPrefix) return fromPrefix;
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    const dateTime = `${tokens[0]}T${tokens[1]}`;
    const parsed = safeParse(dateTime);
    if (parsed) return parsed;
  }

  return null;
}

export function formatMetaDate(raw?: string | null, fallback = "Unknown date") {
  const parsed = parseMetaDate(raw);
  if (!parsed) return raw?.trim() || fallback;
  return displayFormatter.format(parsed);
}

export function compareMetaDatesDesc(a?: string | null, b?: string | null) {
  const da = parseMetaDate(a);
  const db = parseMetaDate(b);
  if (da && db) return db.getTime() - da.getTime();
  if (da) return -1;
  if (db) return 1;
  return 0;
}
