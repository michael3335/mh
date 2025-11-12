// lib/news/guardian.ts

type GuardianTopResponse = {
  response?: {
    results?: GuardianTopArticle[];
  };
};

type GuardianTopArticle = {
  webTitle?: string;
  webUrl?: string;
  fields?: {
    trailText?: string;
  };
  webPublicationDate?: string;
};

export async function fetchGuardianTop(q = "top") {
  const key = process.env.GUARDIAN_API_KEY!;
  const url = new URL("https://content.guardianapis.com/search");
  url.searchParams.set("page-size", "12");
  url.searchParams.set("order-by", "newest");
  url.searchParams.set("show-fields", "headline,trailText,byline,shortUrl");
  url.searchParams.set("q", q);
  url.searchParams.set("api-key", key);
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as GuardianTopResponse;
  const results = json.response?.results ?? [];
  return results.map((r) => ({
    source: "The Guardian",
    title: r.webTitle ?? "",
    url: r.webUrl ?? "#",
    summary: r.fields?.trailText ?? "",
    publishedAt: r.webPublicationDate,
  }));
}
