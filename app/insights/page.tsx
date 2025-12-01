// app/insights/page.tsx
import Link from "next/link";
import { s3, BUCKET } from "@/lib/s3";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { compareMetaDatesDesc, formatMetaDate } from "@/lib/insights/date";

type PostMeta = {
    slug: string;
    title: string;
    author: string;
    date: string;
    summary?: string;
    tags?: string[];
};

export const metadata = {
    title: "Insights",
    description: "Portfolio blog — essays, notes, research, and case studies.",
};

async function listMetas(): Promise<PostMeta[]> {
    // list all objects under insights/ and pick */meta.json
    const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: "insights/" }));
    const keys = (res.Contents ?? []).map(o => o.Key!).filter(k => k.endsWith("/meta.json"));

    const metas: PostMeta[] = [];
    for (const key of keys.slice(0, 100)) {
        const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
        const txt = await obj.Body!.transformToString();
        metas.push(JSON.parse(txt));
    }
    return metas.sort((a, b) => compareMetaDatesDesc(a.date, b.date));
}

export default async function InsightsPage() {
    const posts = await listMetas();

    return (
        <main className="wrap">
            <header className="hero">
                <div className="symbol" aria-hidden>
                    <span className="mark">✍️</span>
                </div>
                <div className="titleBlock">
                    <p className="sectionLabel">Insights</p>
                    <h1>Portfolio essays, notes, and case studies.</h1>
                    <p className="tagline">
                        Lightly edited writing used to test ideas in public — mostly around energy,
                        markets, research process, and long-horizon decision-making.
                    </p>
                    <nav className="links">
                        <Link className="quietLink" href="/insights/new">
                            New post<span aria-hidden> ↗</span>
                        </Link>
                    </nav>
                </div>
            </header>

            <ul className="postGrid">
                {posts.map((p) => (
                    <li key={p.slug} className="postCard">
                        <h3>
                            <Link href={`/insights/${p.slug}`}>{p.title}</Link>
                        </h3>
                        <p className="meta">
                            <span>{formatMetaDate(p.date)}</span> • <span>{p.author}</span>
                            {p.tags?.length ? <> • {p.tags.join(", ")}</> : null}
                        </p>
                        {p.summary ? <p className="summary">{p.summary}</p> : null}
                    </li>
                ))}
                {!posts.length && (
                    <p className="empty">
                        No posts yet.{" "}
                        <Link href="/insights/new">
                            Create one<span aria-hidden> ↗</span>
                        </Link>
                        .
                    </p>
                )}
            </ul>

            <style>{styles}</style>
        </main>
    );
}
const styles = `
.wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 20px 72px;
}

@media (min-width: 900px) {
  .wrap {
    padding-top: 48px;
    padding-bottom: 96px;
  }
}

.hero {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: var(--hairline) solid var(--rule);
  align-items: flex-start;
}

.symbol {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: var(--hairline) solid var(--rule);
}

.mark {
  font-size: 1.2rem;
}

.titleBlock h1 {
  margin: 0 0 0.4rem;
}

.sectionLabel {
  font-family: var(--font-heading), var(--font-sans), system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

.tagline {
  margin: 0;
  color: var(--text-secondary);
}

.links {
  margin-top: 0.75rem;
}

.quietLink {
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--text-secondary);
}

.postGrid {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 0;
  display: grid;
  gap: 0.9rem;
}

.postCard {
  padding-top: 0.9rem;
  border-top: var(--hairline) solid var(--rule);
}

.postCard h3 {
  margin: 0 0 0.3rem;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.meta {
  color: var(--text-muted);
  font-size: 0.8rem;
  margin: 0 0 0.25rem;
}

.summary {
  margin: 0;
}

.empty {
  margin-top: 1.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}
`;
