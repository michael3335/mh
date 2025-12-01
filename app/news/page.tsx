// app/news/page.tsx
// Server component. Contrast-safe via system colors (Canvas/CanvasText/LinkText).
// Lightweight briefing layout with cards and time-stamped header.
// Live "Top stories" wired to The Guardian (Content API), NYTimes (Top Stories API),
// plus BBC & Al Jazeera via RSS. Enterprise sources (Reuters/AP/Economist) are stubbed.

import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";

// Disable caching so the briefing is always fresh on load
export const dynamic = "force-dynamic";

export const metadata = {
  title: "News Briefing",
  description: "Daily news briefing — top stories, markets, and quick links",
};

/* ---------------------------------- TYPES --------------------------------- */

type NewsItem = {
  source: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt?: string | null;
};

type CuratedNewsItem = NewsItem & {
  id?: string;
  tags?: string[];
  rationale?: string;
  score?: number;
};

/* ---------------------- CURATED + BREAKING DATA (SSR) ---------------------- */

async function fetchCuratedStories(): Promise<CuratedNewsItem[]> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (!host) return [];
    const base = `${proto}://${host}`;
    const res = await fetch(`${base}/api/news/curate`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.curated) ? (json.curated as CuratedNewsItem[]) : [];
  } catch {
    return [];
  }
}

// Server-side fetch from your API route at /api/news/breaking
async function fetchBreaking(): Promise<NewsItem | null> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (!host) return null;
    const base = `${proto}://${host}`;
    const res = await fetch(`${base}/api/news/breaking`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.item as NewsItem) ?? null;
  } catch {
    return null;
  }
}

/* --------------------------------- PAGE ----------------------------------- */

export default async function NewsBriefingPage() {
  const todayISO = new Date().toISOString().slice(0, 10);

  const [curated, breaking] = await Promise.all([
    fetchCuratedStories(),
    fetchBreaking(),
  ]);

  return (
    <main className="wrap">
      <BreakingBannerSSR item={breaking} />

      <header className="hero" aria-labelledby="news-title">
        <div className="symbol" aria-hidden>
          <span className="paper" role="img">
            📰
          </span>
        </div>
        <div className="titleBlock">
          <h1 id="news-title">News Briefing</h1>
          <p className="tagline">
            Fast scan of the day’s headlines, markets, and things that matter.
          </p>
        </div>
      </header>

      <section className="grid">
        <Card title="Top stories" icon="⭐">
          {!curated.length ? (
            <p className="muted">No stories available right now.</p>
          ) : (
            <ol className="list">
              {curated.map((it) => (
                <li key={it.id ?? `${it.source}-${it.url}`}>
                  <strong>{it.title}</strong>{" "}
                  <span className="muted">— {it.source}</span>{" "}
                  <a href={it.url} className="pill" target="_blank" rel="noreferrer">
                    Read
                  </a>
                  {it.tags?.length ? (
                    <span className="tags">
                      {it.tags.map((tag: string) => (
                        <span className="tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </span>
                  ) : null}
                  {it.summary ? (
                    <div className="muted small">{it.summary}</div>
                  ) : null}
                  {it.rationale ? (
                    <div className="muted small rationale">{it.rationale}</div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Markets snapshot" icon="📊">
          <div className="markets">
            <Metric label="ASX 200" value="—" delta="—" />
            <Metric label="S&P 500" value="—" delta="—" />
            <Metric label="NASDAQ" value="—" delta="—" />
            <Metric label="WTI" value="—" delta="—" />
            <Metric label="Brent" value="—" delta="—" />
            <Metric label="Gold" value="—" delta="—" />
            <Metric label="AUD/USD" value="—" delta="—" />
            <Metric label="BTC" value="—" delta="—" />
          </div>
          <p className="muted small">
            Hint: we can wire these to a data source later.
          </p>
        </Card>

        <Card title="Energy & climate" icon="⚡">
          <ul className="list">
            <li>Grid & policy updates that shift build-out timelines.</li>
            <li>Commodity moves affecting project economics.</li>
            <li>Storage/battery headlines and notable bids/auctions.</li>
          </ul>
          <nav className="links">
            <Link className="pill" href="/commodities" prefetch>
              Energy &amp; commodities lab
            </Link>
          </nav>
        </Card>

        <Card title="Company watchlist" icon="👀">
          <ul className="list">
            <li>
              <strong>Ticker 1</strong> — catalyst, guidance, or notable filing.
            </li>
            <li>
              <strong>Ticker 2</strong> — new contract, product, or litigation note.
            </li>
            <li>
              <strong>Ticker 3</strong> — FX/commodity sensitivity highlight.
            </li>
          </ul>
        </Card>

        <Card title="Calendar" icon="🗓️">
          <ul className="list">
            <li>09:00 — Economic data (AU): Placeholder</li>
            <li>14:00 — Earnings: Placeholder</li>
            <li>All day — Policy/Regulatory window: Placeholder</li>
          </ul>
        </Card>

        <Card title="Deep reads" icon="📚">
          <ul className="list">
            <li>Long-form analysis #1 — why it matters in one line.</li>
            <li>Long-form analysis #2 — core thesis & counterpoints.</li>
            <li>Long-form analysis #3 — risk matrix & scenarios.</li>
          </ul>
        </Card>
      </section>

      <footer className="foot">
        <span className="footSymbol" aria-hidden>
          📰
        </span>
        <span>Last updated {todayISO}</span>
      </footer>

      {/* NOTE: Plain <style> to avoid styled-jsx in Server Components */}
      <style>{`
        :root {
          --bg: var(--background);
          --fg: var(--foreground);
          --muted: var(--text-muted);
          --rule: var(--rule);
          --pill-bg: var(--background);
          --pill-fg: var(--foreground);
        }
        .wrap {
          background: var(--bg);
          color: var(--fg);
          padding: 32px 20px 72px;
          max-width: 720px;
          margin: 0 auto;
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
          align-items: center;
          padding-bottom: 16px;
          border-bottom: var(--hairline) solid var(--rule);
        }
        .symbol {
          inline-size: 40px;
          block-size: 40px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: var(--hairline) solid var(--rule);
        }
        .paper {
          font-size: 1.2rem;
          line-height: 1;
          display: block;
        }
        .titleBlock h1 {
          margin: 0;
        }
        .tagline { 
          margin: 0; 
          color: var(--muted);
          max-width: 70ch;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          padding-top: 24px;
        }
        .card {
          grid-column: span 1;
          padding-top: 1rem;
          border-top: var(--hairline) solid var(--rule);
          background: transparent;
        }
        .breaking {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: var(--hairline) solid var(--rule);
          margin-bottom: 12px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .flash { font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-secondary); }
        .b-label { font-weight: 700; letter-spacing: 0.02em; }
        .b-sep { opacity: 0.5; }
        .b-headline { text-decoration: none; color: var(--foreground); font-weight: 600; }
        .b-source { color: var(--muted); }

        .cardHeader {
          display: flex; align-items: baseline; gap: 10px;
          margin: 0 0 8px 0;
        }
        .cardTitle { margin: 0; }
        .cardIcon { font-size: 18px; }
        .list { margin: 0; padding-left: 1.1em; }
        .list li { margin: 6px 0; }
        .links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          color: var(--text-secondary);
          border: none;
          padding: 0;
          border-radius: 0;
          background: transparent;
        }
        .tags {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-left: 6px;
        }
        .tag {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 2px 6px;
          border-radius: 999px;
          border: 1px solid var(--rule);
          color: var(--muted);
        }
        .rationale {
          margin-top: 4px;
        }
        .markets {
          display: grid; grid-template-columns: repeat(12, 1fr); gap: 10px;
        }
        .metric {
          grid-column: span 12;
          border: 1px dashed var(--rule);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex; align-items: baseline; justify-content: space-between;
        }
        .metric strong { font-size: clamp(16px, 2vw, 18px); }
        .delta { font-variant-numeric: tabular-nums; }
        .muted { color: var(--muted); }
        .small { font-size: 12px; }
        .foot { 
          display:flex; gap:8px; align-items:center; justify-content:flex-end; 
          padding-top: 18px; border-top: var(--hairline) solid var(--rule); color: var(--muted);
          font-size: 12px;
        }
        .footSymbol { font-size: 14px; }

        /* Responsive spans */
        @media (min-width: 720px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
          .metric { grid-column: span 1; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
        }
      `}</style>
    </main>
  );
}

/* ---------------------------- BREAKING UI (SSR) ---------------------------- */

function BreakingBannerSSR({ item }: { item: NewsItem | null }) {
  if (!item) return null;
  return (
    <div role="region" aria-label="Breaking news" className="breaking">
      <span className="flash" aria-hidden>●</span>
      <span className="b-label">Breaking</span>
      <span className="b-sep" aria-hidden>·</span>
    <a href={item.url} target="_blank" rel="noreferrer" className="b-headline">
      {item.title}
    </a>
      <span className="b-source"> — {item.source}</span>
    </div>
  );
}

/* --------------------------------- UI ------------------------------------- */

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <div className="cardHeader">
        {icon ? <span className="cardIcon" aria-hidden>{icon}</span> : null}
        <h2 className="cardTitle">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="metric" role="group" aria-label={label}>
      <strong>{label}</strong>
      <span className="delta">
        {value}
        {delta ? ` (${delta})` : ""}
      </span>
    </div>
  );
}
