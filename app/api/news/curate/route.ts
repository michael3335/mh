import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { fetchGuardianTop } from "@/lib/news/guardian";
import { fetchNYTTop } from "@/lib/news/nyt";
import { fetchRSS } from "@/lib/news/rss";

type Article = {
  id: string;
  source: string;
  title: string;
  url: string;
  summary: string;
  publishedAt?: string | null;
};

type CuratedArticle = Article & {
  tags?: string[];
  rationale?: string;
  score?: number;
};

type GatewayRankedItem = {
  id: string;
  tags?: string[];
  rationale?: string;
  score?: number;
};

type GatewayCompletion = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const RSS_SOURCES = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml?edition=uk", source: "BBC" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera" },
];

export async function GET() {
  const [guardian, nyt, ...rssSets] = await Promise.all([
    fetchGuardianTop(""),
    fetchNYTTop("world"),
    ...RSS_SOURCES.map(({ url, source }) => fetchRSS(url, source)),
  ]);

  const articles = [...guardian, ...nyt, ...rssSets.flat()]
    .filter((entry) => entry.title && entry.url)
    .map<Article>((entry, index) => ({
      id: entry.url ? `${entry.source}-${index}-${randomUUID()}` : randomUUID(),
      source: entry.source,
      title: entry.title,
      url: entry.url,
      summary: entry.summary ?? "",
      publishedAt: entry.publishedAt ?? null,
    }))
    .slice(0, 24);

  const curated = await curateWithGateway(articles);

  return NextResponse.json({
    curated,
    articles,
  });
}

async function curateWithGateway(articles: Article[]): Promise<CuratedArticle[]> {
  if (!articles.length) return [];

  const gatewayUrl = process.env.VERCEL_AI_GATEWAY_URL;
  const gatewayKey = process.env.VERCEL_AI_GATEWAY_API_KEY;
  const model = process.env.VERCEL_AI_GATEWAY_MODEL ?? "gpt-4o-mini";

  if (!gatewayUrl || !gatewayKey) {
    return defaultSort(articles);
  }

  const condensed = articles.map((article) => ({
    id: article.id,
    title: article.title,
    source: article.source,
    url: article.url,
    summary: article.summary.slice(0, 320),
    publishedAt: article.publishedAt,
  }));

  try {
    const completion = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a news curator. Rank stories by impact, relevance, and freshness for an energy + markets audience. " +
              "Return JSON with a `items` array where each element has: id, title, url, source, summary, tags (array of <=3 keywords), " +
              "rationale (one sentence), and score (0-1). Preserve provided ids.",
          },
          {
            role: "user",
            content: JSON.stringify({ articles: condensed }),
          },
        ],
      }),
    });

    if (!completion.ok) {
      console.error("AI gateway error", completion.status, await completion.text());
      return defaultSort(articles);
    }

    const json = (await completion.json()) as GatewayCompletion;
    const content = json.choices?.[0]?.message?.content;
    if (!content) return defaultSort(articles);

    const parsed = JSON.parse(content);
    const items = Array.isArray(parsed.items) ? parsed.items : parsed.curated;
    if (!Array.isArray(items)) return defaultSort(articles);

    const byId = Object.fromEntries(articles.map((article) => [article.id, article]));
    const ranked = items
      .map<CuratedArticle | null>((item: GatewayRankedItem, idx: number) => {
        const reference = byId[item.id];
        if (!reference) return null;
        return {
          ...reference,
          tags: Array.isArray(item.tags) ? item.tags.slice(0, 3) : undefined,
          rationale: typeof item.rationale === "string" ? item.rationale : "",
          score: typeof item.score === "number" ? item.score : Number(idx),
        };
      })
      .filter((entry): entry is CuratedArticle => entry !== null);
    return ranked;
  } catch (error) {
    console.error("AI gateway request failed", error);
    return defaultSort(articles);
  }
}

function defaultSort(articles: Article[]): CuratedArticle[] {
  return [...articles]
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
    )
    .slice(0, 18)
    .map((article) => ({
      ...article,
      tags: [],
      rationale: "Ranked by recency (fallback)",
    }));
}
