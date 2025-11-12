// app/insights/page.tsx
import Link from "next/link";

export const metadata = {
    title: "Insights",
    description:
        "Portfolio blog for essays, notes, and research — demonstrate understanding with long-form writing.",
};

type Post = {
    slug: string;
    title: string;
    summary: string;
    date: string; // ISO yyyy-mm-dd
    tags?: string[];
};

const DEMO_POSTS: Post[] = [
    {
        slug: "energy-storage-arb",
        title: "Battery Arbitrage: Where The Spread Actually Lives",
        summary:
            "Mapping 5-minute price distributions to storage dispatch and why scarcity rents cluster on shoulder hours.",
        date: "2025-10-14",
        tags: ["Energy", "Markets", "Strategy"],
    },
    {
        slug: "lcoe-sensitivity",
        title: "LCOE Isn’t a Price: WACC, Curves, and Context",
        summary:
            "A quick explainer on levelized costs, discount rates, and the mistakes people make when they compare techs.",
        date: "2025-09-02",
        tags: ["Finance", "Modeling"],
    },
    {
        slug: "policy-permitting",
        title: "Permitting Is the New Policy",
        summary:
            "Why queue reform beats new subsidies for unlocking grids and generation at scale.",
        date: "2025-07-21",
        tags: ["Policy", "Energy"],
    },
];

export default function InsightsPage() {
    return (
        <main className="wrap">
            <header className="hero" aria-labelledby="insights-title">
                <div className="symbol" aria-hidden>
                    <span className="mark" role="img">✍️</span>
                </div>
                <div className="titleBlock">
                    <h1 id="insights-title">Insights</h1>
                    <p className="tagline">
                        Long-form writing to demonstrate judgment and depth — essays, research
                        notes, case studies, and concept explainers.
                    </p>
                    <nav className="links">
                        <Link className="pill" href="/notes" prefetch>Draft in Notes</Link>
                        <Link className="pill" href="/energy" prefetch>Energy hub</Link>
                        <Link className="pill" href="/commodities" prefetch>Commodities</Link>
                    </nav>
                </div>
            </header>

            <section className="grid">
                <section className="card featured">
                    <div className="cardHeader">
                        <span className="cardIcon" aria-hidden>⭐</span>
                        <h2 className="cardTitle">Featured</h2>
                    </div>
                    <ul className="postList">
                        {DEMO_POSTS.slice(0, 1).map((p) => (
                            <li key={p.slug}>
                                <PostCard post={p} priority />
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="card allPosts">
                    <div className="cardHeader">
                        <span className="cardIcon" aria-hidden>🗂️</span>
                        <h2 className="cardTitle">All posts</h2>
                    </div>
                    <ul className="postGrid">
                        {DEMO_POSTS.map((p) => (
                            <li key={p.slug}><PostCard post={p} /></li>
                        ))}
                    </ul>
                </section>

                <section className="card howTo">
                    <div className="cardHeader">
                        <span className="cardIcon" aria-hidden>🧭</span>
                        <h2 className="cardTitle">How publishing works (v0)</h2>
                    </div>
                    <ol className="list">
                        <li>Draft in <Link href="/notes">Notes</Link> or your editor of choice.</li>
                        <li>Export to Markdown/MDX with title, date, summary, and tags.</li>
                        <li>Add the file to your content source (MDX or database) and it will render here.</li>
                    </ol>
                    <p className="muted small">
                        We can wire this to MDX files (e.g. <code>/content/insights/*.mdx</code>)
                        or Prisma/RDS. Your choice — the UI won’t change.
                    </p>
                </section>
            </section>

            <footer className="foot">
                <span className="footSymbol" aria-hidden>✍️</span>
                <span>Last updated {new Date().toISOString().slice(0, 10)}</span>
            </footer>

            <style>{`
        :root {
          --bg: Canvas;
          --fg: CanvasText;
          --muted: color-mix(in oklab, CanvasText 60%, Canvas 40%);
          --rule: color-mix(in oklab, CanvasText 15%, Canvas 85%);
          --pill-bg: color-mix(in oklab, CanvasText 8%, Canvas 92%);
          --pill-fg: LinkText;
        }
        .wrap { background: var(--bg); color: var(--fg); padding: clamp(20px, 4vw, 40px); max-width: 1200px; margin: 0 auto; }
        .hero { display: grid; grid-template-columns: auto 1fr; gap: clamp(16px, 3vw, 28px); align-items: center; padding-block: clamp(8px, 2vw, 20px); border-bottom: 1px solid var(--rule); }
        .symbol { inline-size: clamp(64px, 10vw, 96px); block-size: clamp(64px, 10vw, 96px); display: grid; place-items: center; border-radius: 20px; background: color-mix(in oklab, CanvasText 6%, Canvas 94%); box-shadow: 0 1px 0 color-mix(in oklab, CanvasText 8%, transparent), 0 12px 40px color-mix(in oklab, CanvasText 8%, transparent); }
        .mark { font-size: clamp(40px, 7vw, 56px); line-height: 1; display: block; transform: translateY(1px); }
        .titleBlock h1 { font-size: clamp(40px, 6vw, 72px); letter-spacing: -0.02em; margin: 0; }
        .tagline { margin: 8px 0 0; font-size: clamp(14px, 1.7vw, 18px); color: var(--muted); max-width: 70ch; }
        .links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .pill { display: inline-block; padding: 8px 12px; border-radius: 999px; background: var(--pill-bg); color: var(--pill-fg); text-decoration: none; border: 1px solid var(--rule); }

        .grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: clamp(14px, 2vw, 22px); padding-block: clamp(16px, 3vw, 28px); }
        .card { grid-column: span 12; border: 1px solid var(--rule); border-radius: 16px; padding: clamp(14px, 2vw, 22px); background: color-mix(in oklab, Canvas 98%, CanvasText 2%); }
        .cardHeader { display: flex; align-items: baseline; gap: 10px; margin: 0 0 8px 0; }
        .cardTitle { font-size: clamp(18px, 2.2vw, 22px); margin: 0; }
        .cardIcon { font-size: 18px; }

        .postList { list-style: none; margin: 0; padding: 0; }
        .postGrid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px; }
        .postGrid > li { grid-column: span 12; }

        .postCard { border: 1px dashed var(--rule); border-radius: 14px; padding: 12px; display: grid; gap: 6px; background: color-mix(in oklab, Canvas 99%, CanvasText 1%); }
        .postMeta { color: var(--muted); font-size: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
        .tags { display: inline-flex; gap: 6px; flex-wrap: wrap; }
        .tag { font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--rule); background: var(--pill-bg); }

        .muted { color: var(--muted); }
        .small { font-size: 12px; }

        .foot { display:flex; gap:8px; align-items:center; justify-content:flex-end; padding-top: 18px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 12px; }
        .footSymbol { font-size: 14px; }

        @media (min-width: 720px) {
          .featured { grid-column: span 6; }
          .allPosts { grid-column: span 6; }
          .howTo { grid-column: span 12; }
          .postGrid > li { grid-column: span 6; }
        }

        @media (prefers-reduced-motion: reduce) {
          .mark { transform: none !important; }
        }
      `}</style>
        </main>
    );
}

function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
    const { slug, title, summary, date, tags } = post;
    return (
        <article className="postCard" aria-labelledby={`post-${slug}`}>
            <h3
                id={`post-${slug}`}
                style={{ margin: 0, fontSize: priority ? "clamp(18px,2.4vw,24px)" : "clamp(16px,2vw,20px)" }}
            >
                {/* Use UrlObject with dynamic route + query (typed-safe) */}
                <Link href={{ pathname: "/insights/[slug]", query: { slug } }} prefetch>
                    {title}
                </Link>
            </h3>
            <p className="postMeta">
                <span>{formatDate(date)}</span>
                {tags?.length ? (
                    <span className="tags">
                        {tags.map((t) => (
                            <span key={t} className="tag" aria-label={`tag ${t}`}>{t}</span>
                        ))}
                    </span>
                ) : null}
            </p>
            <p style={{ margin: 0 }}>{summary}</p>
        </article>
    );
}

function formatDate(iso: string) {
    const d = new Date(iso + "T00:00:00");
    const fmt = new Intl.DateTimeFormat("en-AU", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "Australia/Hobart",
    });
    return fmt.format(d);
}
