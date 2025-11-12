// lib/news/nyt.ts
export async function fetchNYTTop(section = "world") {
  const key = process.env.NYT_API_KEY!;
  const res = await fetch(
    `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${key}`,
    { cache: "no-store" }
  );
  const json = await res.json();
  return json.results.slice(0, 12).map((it: any) => ({
    source: "NYTimes",
    title: it.title,
    url: it.url,
    summary: it.abstract ?? "",
    publishedAt: it.published_date,
  }));
}
