// app/insights/[slug]/page.tsx
import Link from "next/link";
import { s3, BUCKET } from "@/lib/s3";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatMetaDate } from "@/lib/insights/date";

type PostMeta = {
    slug: string;
    title: string;
    author: string;
    date: string;
    summary?: string;
    tags?: string[];
};

async function fetchPost(slug: string): Promise<{ meta: PostMeta; content: string } | null> {
    const base = `insights/${encodeURIComponent(slug)}`;
    try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: `${base}/meta.json` }));
    } catch {
        return null;
    }
    const [metaObj, contentObj] = await Promise.all([
        s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: `${base}/meta.json` })),
        s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: `${base}/content.md` })),
    ]);
    const [metaText, mdText] = await Promise.all([
        metaObj.Body!.transformToString(),
        contentObj.Body!.transformToString(),
    ]);
    return { meta: JSON.parse(metaText), content: mdText };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const data = await fetchPost(params.slug);
    if (!data) return { title: "Not found • Insights" };
    return { title: `${data.meta.title} • Insights`, description: data.meta.summary || data.meta.title };
}

export default async function InsightPage({ params }: { params: { slug: string } }) {
    const data = await fetchPost(params.slug);
    if (!data) {
        return (
            <main className="wrap">
                <h1>Not found</h1>
                <p><Link href="/insights">← Back to Insights</Link></p>
            </main>
        );
    }

    const { meta, content } = data;

    return (
        <main className="wrap">
            <header className="hero">
                <div className="symbol"><span className="mark">✍️</span></div>
                <div className="titleBlock">
                    <h1>{meta.title}</h1>
                    <p className="meta">
                        <span>{formatMetaDate(meta.date)}</span> • <span>{meta.author}</span>
                        {meta.tags?.length ? <> • {meta.tags.join(", ")}</> : null}
                    </p>
                    {meta.summary ? <p className="tagline">{meta.summary}</p> : null}
                </div>
            </header>

            <article className="prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>

            <nav className="footNav">
                <Link className="pill" href="/insights">← Back to Insights</Link>
            </nav>

            <style>{styles}</style>
        </main>
    );
}
const styles = `
.wrap { max-width: 820px; margin: 0 auto; padding: clamp(16px, 4vw, 32px); }
.hero { display: grid; grid-template-columns: auto 1fr; gap: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 12px; }
.symbol { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 16px; background: #f6f6f9; }
.mark { font-size: 40px; }
.titleBlock h1 { margin: 0; font-size: clamp(24px, 4vw, 40px); }
.meta { color: #666; margin: 6px 0 0; }
.tagline { color: #666; margin: 6px 0 0; }
.prose { margin-top: 16px; }
.footNav { margin-top: 16px; border-top: 1px solid #e5e5e5; padding-top: 12px; }
.pill { display: inline-block; padding: 8px 12px; border-radius: 999px; border: 1px solid #ddd; text-decoration: none; }
`;
