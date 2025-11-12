// app/insights/drafts/page.tsx
import Link from "next/link";
import { s3, BUCKET } from "@/lib/s3";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

type DraftMeta = {
    slug: string;
    title: string;
    author: string;
    date: string;
    summary?: string;
    tags?: string[];
    status?: "draft" | "published";
};

export const metadata = {
    title: "Drafts • Insights",
    description: "Work-in-progress posts.",
};

async function listDrafts(): Promise<DraftMeta[]> {
    const res = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: "insights/_drafts/",
    }));
    const keys = (res.Contents ?? []).map(o => o.Key!).filter(k => k.endsWith("/meta.json"));

    const items: DraftMeta[] = [];
    for (const key of keys.slice(0, 100)) {
        const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
        const txt = await obj.Body!.transformToString();
        items.push(JSON.parse(txt));
    }
    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default async function DraftsPage() {
    const drafts = await listDrafts();
    return (
        <main className="wrap">
            <header className="hero">
                <div className="symbol"><span className="mark">✍️</span></div>
                <div className="titleBlock">
                    <h1>Drafts</h1>
                    <p className="tagline">Continue where you left off.</p>
                    <nav className="links">
                        <Link className="pill" href="/insights/new">New draft</Link>
                        <Link className="pill" href="/insights">Published</Link>
                    </nav>
                </div>
            </header>

            <ul className="postGrid">
                {drafts.map((p) => (
                    <li key={p.slug} className="postCard">
                        <h3><Link href={`/insights/edit/${p.slug}`}>{p.title}</Link></h3>
                        <p className="meta">
                            <span>{formatDate(p.date)}</span> • <span>{p.author}</span>
                            {p.tags?.length ? <> • {p.tags.join(", ")}</> : null}
                        </p>
                        {p.summary ? <p>{p.summary}</p> : null}
                    </li>
                ))}
                {!drafts.length && <p>No drafts yet. <Link href="/insights/new">Start one</Link>.</p>}
            </ul>
        </main>
    );
}

function formatDate(iso: string) {
    const d = new Date(iso + "T00:00:00");
    return new Intl.DateTimeFormat("en-AU", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}