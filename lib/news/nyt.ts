// lib/news/nyt.ts

type NYTTopResponse = {
  results?: NYTTopArticle[];
};

type NYTTopArticle = {
  title?: string;
  url?: string;
  abstract?: string;
  published_date?: string;
};

export async function fetchNYTTop(section = "world") {
  const key = process.env.NYT_API_KEY;
  if (!key) return [];
  const res = await fetch(
    `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${key}`,
    { cache: "no-store" }
  );
  const json = (await res.json()) as NYTTopResponse;
  const results = json.results ?? [];
  return results.slice(0, 12).map((it) => ({
    source: "NYTimes",
    title: it.title ?? "",
    url: it.url ?? "#",
    summary: it.abstract ?? "",
    publishedAt: it.published_date,
  }));
}
