// app/api/news/breaking/route.ts
import { NextResponse } from "next/server";

type Item = {
  source: string;
  title: string;
  url: string;
  publishedAt?: string | null;
};

type GuardianBreakingResponse = {
  response?: {
    results?: GuardianBreakingResult[];
  };
};

type GuardianBreakingResult = {
  webTitle?: string;
  webUrl?: string;
  webPublicationDate?: string;
};

type NYTBreakingResponse = {
  results?: NYTBreakingResult[];
};

type NYTBreakingResult = {
  title?: string;
  url?: string;
  published_date?: string;
};

// helpers
const stripTags = (s?: string) => (s ? s.replace(/<[^>]*>/g, "").trim() : "");

async function fetchGuardian(): Promise<Item[]> {
  const key = process.env.GUARDIAN_API_KEY;
  if (!key) return [];
  const url = new URL("https://content.guardianapis.com/search");
  url.searchParams.set("page-size", "5");
  url.searchParams.set("order-by", "newest");
  url.searchParams.set("show-fields", "trailText");
  url.searchParams.set("api-key", key);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as GuardianBreakingResponse;
  const results = json.response?.results ?? [];
  return results.map((r) => ({
    source: "The Guardian",
    title: r.webTitle ?? "",
    url: r.webUrl ?? "#",
    publishedAt: r.webPublicationDate,
  }));
}

async function fetchNYT(section = "world"): Promise<Item[]> {
  const key = process.env.NYT_API_KEY;
  if (!key) return [];
  const res = await fetch(
    `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${key}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const json = (await res.json()) as NYTBreakingResponse;
  const items = (json.results ?? []).slice(0, 5);
  return items.map((i) => ({
    source: "NYTimes",
    title: stripTags(i.title ?? "") || "Top Story",
    url: i.url ?? "#",
    publishedAt: i.published_date ?? null,
  }));
}

async function fetchBBC(): Promise<Item[]> {
  const res = await fetch(
    "https://feeds.bbci.co.uk/news/world/rss.xml?edition=uk",
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const xml = await res.text();
  const chunks = xml
    .split(/<item[\s>]/i)
    .slice(1)
    .slice(0, 5);
  return chunks.map((c) => ({
    source: "BBC",
    title: (
      c.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i)?.[1] ??
      c.match(/<title>([^<]+)<\/title>/i)?.[1] ??
      ""
    ).trim(),
    url: (c.match(/<link>([^<]+)<\/link>/i)?.[1] ?? "").trim(),
    publishedAt: c.match(/<pubDate>([^<]+)<\/pubDate>/i)?.[1]?.trim() ?? null,
  }));
}

export async function GET() {
  const [g, n, b] = await Promise.all([
    fetchGuardian(),
    fetchNYT(),
    fetchBBC(),
  ]);
  const items = [...g, ...n, ...b]
    .filter((i) => i.title && i.url)
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? 0).getTime()
    );
  // pick the most recent as “breaking-ish”
  const top = items[0] ?? null;
  return NextResponse.json({ item: top, items });
}
