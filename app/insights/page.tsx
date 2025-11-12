// app/insights/page.tsx
import Link from "next/link";
import { s3, BUCKET } from "@/lib/s3";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

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
    return metas.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default async function InsightsPage() {
    const posts = await listMetas();

    return (
        <main className="wrap">
            <header className="hero">
                <div className="symbol" aria-hidden><span className="mark">✍️</span></div>
                <div className="titleBlock">
                    <h1>Insights</h1>
                    <p className="tagline">Long-form writing to demonstrate judgment and depth.</p>
                    <nav className="links">
                        <Link className="pill" href="/insights/new">New post</Link>
                    </nav>
                </div>
            </header>

            <ul className="postGrid">
                {posts.map((p) => (
                    <li key={p.slug} className="postCard">
                        <h3><Link href={`/insights/${p.slug}`}>{p.title}</Link></h3>
                        <p className="meta">
                            <span>{formatDate(p.date)}</span> • <span>{p.author}</span>
                            {p.tags?.length ? <> • {p.tags.join(", ")}</> : null}
                        </p>
                        {p.summary ? <p>{p.summary}</p> : null}
                    </li>
                ))}
                {!posts.length && <p>No posts yet. <Link href="/insights/new">Create one</Link>.</p>}
            </ul>

            <style>{styles}</style>
        </main>
    );
}

function formatDate(iso: string) {
    const d = new Date(iso + "T00:00:00");
    return new Intl.DateTimeFormat("en-AU", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}

const styles = `
.wrap { max-width: 1000px; margin: 0 auto; padding: clamp(16px, 4vw, 32px); }
.hero { display: grid; grid-template-columns: auto 1fr; gap: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 12px; }
.symbol { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 16px; background: #f6f6f9; }
.mark { font-size: 40px; }
.titleBlock h1 { margin: 0; font-size: clamp(24px, 4vw, 40px); }
.tagline { margin: 6px 0 0; color: #666; }
.links { margin-top: 8px; }
.pill { display: inline-block; padding: 8px 12px; border-radius: 999px; border: 1px solid #ddd; text-decoration: none; }

.postGrid { list-style: none; padding: 0; margin: 18px 0 0; display: grid; gap: 12px; }
.postCard { border: 1px solid #eaeaea; border-radius: 12px; padding: 12px; }
.postCard h3 { margin: 0 0 6px 0; }
.meta { color: #666; font-size: 14px; margin: 0 0 6px 0; }
`;