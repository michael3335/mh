// app/news/page.tsx
// Server component. Contrast-safe via system colors (Canvas/CanvasText/LinkText).
// Lightweight briefing layout with cards and time-stamped header.

import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
    title: "News Briefing",
    description: "Daily news briefing — top stories, markets, and quick links",
};

export default function NewsBriefingPage() {
    const todayISO = new Date().toISOString().slice(0, 10);

    return (
        <main className="wrap">
            <header className="hero" aria-labelledby="news-title">
                <div className="symbol" aria-hidden>
                    <span className="paper" role="img">📰</span>
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
                    <ol className="list">
                        <li>
                            <strong>Headline A:</strong> One-line summary for context and why it matters.
                        </li>
                        <li>
                            <strong>Headline B:</strong> Concise takeaway and immediate impact.
                        </li>
                        <li>
                            <strong>Headline C:</strong> What changed, who’s affected, next steps.
                        </li>
                    </ol>
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
                        <Link className="pill" href="/energy" prefetch>
                            Energy hub
                        </Link>
                        <Link className="pill" href="/commodities" prefetch>
                            Commodities
                        </Link>
                    </nav>
                </Card>

                <Card title="Company watchlist" icon="👀">
                    <ul className="list">
                        <li><strong>Ticker 1</strong> — catalyst, guidance, or notable filing.</li>
                        <li><strong>Ticker 2</strong> — new contract, product, or litigation note.</li>
                        <li><strong>Ticker 3</strong> — FX/commodity sensitivity highlight.</li>
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
                <span className="footSymbol" aria-hidden>📰</span>
                <span>Last updated {todayISO}</span>
            </footer>

            {/* NOTE: Plain <style> to avoid styled-jsx in Server Components */}
            <style>{`
        :root {
          --bg: Canvas;
          --fg: CanvasText;
          --muted: color-mix(in oklab, CanvasText 60%, Canvas 40%);
          --rule: color-mix(in oklab, CanvasText 15%, Canvas 85%);
          --pill-bg: color-mix(in oklab, CanvasText 8%, Canvas 92%);
          --pill-fg: LinkText;
        }
        .wrap {
          background: var(--bg);
          color: var(--fg);
          padding: clamp(20px, 4vw, 40px);
          max-width: 1200px;
          margin: 0 auto;
        }
        .hero {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: clamp(16px, 3vw, 28px);
          align-items: center;
          padding-block: clamp(8px, 2vw, 20px);
          border-bottom: 1px solid var(--rule);
        }
        .symbol {
          inline-size: clamp(64px, 10vw, 96px);
          block-size: clamp(64px, 10vw, 96px);
          display: grid;
          place-items: center;
          border-radius: 20px;
          box-shadow: 0 1px 0 color-mix(in oklab, CanvasText 8%, transparent),
            0 12px 40px color-mix(in oklab, CanvasText 8%, transparent);
          background: color-mix(in oklab, CanvasText 6%, Canvas 94%);
        }
        .paper {
          font-size: clamp(40px, 7vw, 56px);
          line-height: 1;
          display: block;
          transform: translateY(1px);
        }
        .titleBlock h1 {
          font-size: clamp(40px, 6vw, 72px);
          letter-spacing: -0.02em;
          margin: 0;
        }
        .tagline { 
          margin: 8px 0 0; 
          font-size: clamp(14px, 1.7vw, 18px);
          color: var(--muted);
          max-width: 70ch;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: clamp(14px, 2vw, 22px);
          padding-block: clamp(16px, 3vw, 28px);
        }
        .card {
          grid-column: span 12;
          border: 1px solid var(--rule);
          border-radius: 16px;
          padding: clamp(14px, 2vw, 22px);
          background: color-mix(in oklab, Canvas 98%, CanvasText 2%);
        }
        .cardHeader {
          display: flex; align-items: baseline; gap: 10px;
          margin: 0 0 8px 0;
        }
        .cardTitle { font-size: clamp(18px, 2.2vw, 22px); margin: 0; }
        .cardIcon { font-size: 18px; }
        .list { margin: 0; padding-left: 1.1em; }
        .list li { margin: 6px 0; }
        .links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .pill {
          display: inline-block; padding: 8px 12px; border-radius: 999px;
          background: var(--pill-bg); color: var(--pill-fg); text-decoration: none;
          border: 1px solid var(--rule);
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
          padding-top: 18px; border-top: 1px solid var(--rule); color: var(--muted);
          font-size: 12px;
        }
        .footSymbol { font-size: 14px; }

        /* Responsive spans */
        @media (min-width: 720px) {
          .card:nth-child(1) { grid-column: span 7; }
          .card:nth-child(2) { grid-column: span 5; }
          .card:nth-child(3) { grid-column: span 7; }
          .card:nth-child(4) { grid-column: span 5; }
          .card:nth-child(5) { grid-column: span 6; }
          .card:nth-child(6) { grid-column: span 6; }

          .metric { grid-column: span 6; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .paper { transform: none !important; }
        }
      `}</style>
        </main>
    );
}

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
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
            <span className="delta">{value}{delta ? ` (${delta})` : ""}</span>
        </div>
    );
}
