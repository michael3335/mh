// lib/news/rss.ts
import Parser from "rss-parser";
const parser = new Parser();

export async function fetchRSS(url: string, source: string) {
  const feed = await parser.parseURL(url);
  return (feed.items ?? []).slice(0, 12).map((i) => ({
    source,
    title: i.title ?? "",
    url: i.link ?? "#",
    summary: i.contentSnippet ?? "",
    publishedAt: i.isoDate ?? i.pubDate ?? null,
  }));
}

export async function fetchReuters() {
  return [];
} // TODO: wire Reuters Connect/API
export async function fetchAP() {
  return [];
} // TODO: wire AP Media/Elections APIs
export async function fetchEIU() {
  return [];
} // TODO: wire EIU APIs if useful
