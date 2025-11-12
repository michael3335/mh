// app/insights/[slug]/page.tsx
// Server component. Dynamic route for individual Insight posts.

import Link from "next/link";

type Post = {
    slug: string;
    title: string;
    date: string; // ISO yyyy-mm-dd
    summary: string;
    tags?: string[];
    body: string[]; // simple paragraphs for now; swap to MDX later
};

// --- Demo content (replace with MDX/DB fetch) ---
const POSTS: Record<string, Post> = {
    "energy-storage-arb": {
        slug: "energy-storage-arb",
        title: "Battery Arbitrage: Where The Spread Actually Lives",
        date: "2025-10-14",
        summary:
            "Mapping 5-minute price distributions to storage dispatch and why scarcity rents cluster on shoulder hours.",
        tags: ["Energy", "Markets", "Strategy"],
        body: [
            "Battery revenue is dominated by a handful of high-spread intervals, not the average day. That pushes strategy toward probabilistic dispatch rather than simple heuristic rules.",
            "We examine shoulder-hour clustering, FCAS uplifts, and congestion pockets that change node-level spreads — especially under interconnector constraints.",
            "A practical takeaway: pair price-shape analysis with availability windows and cycle budgets; optimize the last 10–15% of dispatch, not the first 85%.",
        ],
    },
    "lcoe-sensitivity": {
        slug: "lcoe-sensitivity",
        title: "LCOE Isn’t a Price: WACC, Curves, and Context",
        date: "2025-09-02",
        summary:
            "A quick explainer on levelized costs, discount rates, and the mistakes people make when they compare techs.",
        tags: ["Finance", "Modeling"],
        body: [
            "LCOE is a financing- and utilization-dependent statistic. Comparing across technologies without normalizing for WACC, capacity factor, and curtailment bakes in apples-to-oranges bias.",
            "We show how plausible WACC bands shift rankings and why ‘cheapest’ in league tables can mask integration costs and grid constraints.",
        ],
    },
    "policy-permitting": {
        slug: "policy-permitting",
        title: "Permitting Is the New Policy",
        date: "2025-07-21",
        summary:
            "Why queue reform beats new subsidies for unlocking grids and generation at scale.",
        tags: ["Policy", "Energy"],
        body: [
            "Bottlenecks moved from capex to process. Interconnection queues, land, and transmission corridors set the pace.",
            "Simplify milestones, time-box studies, and stage deposits to align incentives. The cheapest subsidy is often time.",
        ],
    },
};

function getPostBySlug(slug: string): Post | null {
    return POSTS[slug] ?? null;
}

// --- Static params for SSG (optional but nice) ---
export function generateStaticParams() {
    return Object.keys(POSTS).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
    const post = getPostBySlug(params.slug);
    if (!post) {
        return { title: "Not found • Insights" };
    }
    return {
        title: `${post.title} • Insights`,
        description: post.summary,
    };
}

export default function InsightPostPage({ params }: { params: { slug: string } }) {
    const post = getPostBySlug(params.slug);

    if (!post) {
        return (
            <main className="wrap">
                <header className="hero">
                    <div className="symbol" aria-hidden>
                        <span className="mark" role="img">✍️</span>
                    </div>
                    <div className="titleBlock">
                        <h1>Post not found</h1>
                        <p className="tagline">The post you’re looking for doesn’t exist.</p>
                    </div>
                </header>
                <p style={{ marginTop: 16 }}>
                    <Link href="/insights">← Back to Insights</Link>
                </p>
                <style>{baseStyles}</style>
            </main>
        );
    }

    return (
        <main className="wrap">
            <header className="hero" aria-labelledby="post-title">
                <div className="symbol" aria-hidden>
                    <span className="mark" role="img">✍️</span>
                </div>
                <div className="titleBlock">
                    <h1 id="post-title">{post.title}</h1>
                    <p className="meta">
                        <span>{formatDate(post.date)}</span>
                        {post.tags?.length ? (
                            <span className="tags">
                                {post.tags.map((t) => (
                                    <span key={t} className="tag" aria-label={`tag ${t}`}>{t}</span>
                                ))}
                            </span>
                        ) : null}
                    </p>
                    <p className="tagline">{post.summary}</p>
                </div>
            </header>

            <article className="prose">
                {post.body.map((para, i) => (
                    <p key={i}>{para}</p>
                ))}
            </article>

            <nav className="footNav">
                <Link href="/insights" prefetch className="pill">← Back to Insights</Link>
            </nav>

            {/* Plain <style> to avoid styled-jsx in Server Component */}
            <style>{baseStyles}</style>
        </main>
    );
}

// --- Utilities ---
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

const baseStyles = `
:root {
  --bg: Canvas;
  --fg: CanvasText;
  --muted: color-mix(in oklab, CanvasText 60%, Canvas 40%);
  --rule: color-mix(in oklab, CanvasText 15%, Canvas 85%);
  --pill-bg: color-mix(in oklab, CanvasText 8%, Canvas 92%);
  --pill-fg: LinkText;
}
.wrap { background: var(--bg); color: var(--fg); padding: clamp(20px, 4vw, 40px); max-width: 920px; margin: 0 auto; }
.hero {
  display: grid; grid-template-columns: auto 1fr; gap: clamp(16px, 3vw, 28px);
  align-items: center; padding-block: clamp(8px, 2vw, 20px); border-bottom: 1px solid var(--rule);
}
.symbol {
  inline-size: clamp(64px, 10vw, 96px); block-size: clamp(64px, 10vw, 96px);
  display: grid; place-items: center; border-radius: 20px;
  background: color-mix(in oklab, CanvasText 6%, Canvas 94%);
  box-shadow: 0 1px 0 color-mix(in oklab, CanvasText 8%, transparent),
              0 12px 40px color-mix(in oklab, CanvasText 8%, transparent);
}
.mark { font-size: clamp(40px, 7vw, 56px); line-height: 1; display: block; transform: translateY(1px); }
.titleBlock h1 { font-size: clamp(32px, 5vw, 56px); letter-spacing: -0.02em; margin: 0; }
.meta { display: flex; gap: 10px; flex-wrap: wrap; color: var(--muted); margin: 8px 0 0; font-size: 14px; }
.tags { display: inline-flex; gap: 6px; }
.tag { font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--rule); background: var(--pill-bg); }
.tagline { margin: 6px 0 0; color: var(--muted); max-width: 70ch; }

.prose { padding-block: clamp(16px, 3vw, 28px); }
.prose p { margin: 0 0 14px 0; line-height: 1.65; }

.footNav { border-top: 1px solid var(--rule); padding-top: 16px; display: flex; justify-content: space-between; }
.pill {
  display: inline-block; padding: 8px 12px; border-radius: 999px;
  background: var(--pill-bg); color: var(--pill-fg); text-decoration: none;
  border: 1px solid var(--rule);
}

@media (prefers-reduced-motion: reduce) { .mark { transform: none !important; } }
`;
