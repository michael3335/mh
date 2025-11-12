// app/energy/page.tsx
// Server component. Contrast-safe via system colors (Canvas/CanvasText/LinkText).
// Minimalist layout; big symbol; airy spacing. No client hooks required.

import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
    title: "Energy",
    description:
        "Energy & commodities hub — frameworks, thesis, tools, links, and KPIs",
};

export default function EnergyPage() {
    return (
        <main className="wrap">
            <header className="hero" aria-labelledby="energy-title">
                <div className="symbol" aria-hidden>
                    <span className="bolt" role="img">⚡</span>
                </div>
                <div className="titleBlock">
                    <h1 id="energy-title">Energy</h1>
                    <p className="tagline">
                        A focused workspace for energy economics, power markets, and
                        decarbonisation strategy — tying together research, models, and
                        positions.
                    </p>
                </div>
            </header>

            <section className="grid">
                <Card title="Thesis" icon="📈">
                    <ul className="list">
                        <li>
                            Electrify-everything + grids as the bottleneck → CAPEX supercycle in
                            generation, transmission, storage, flexibility.
                        </li>
                        <li>
                            Gas remains a balancing fuel this decade; mid-merit squeezed by
                            storage and DR; nuclear small but durable where policy aligned.
                        </li>
                        <li>
                            Metals tightness (Cu, Ni, Li) transmits into OEM margins; policy
                            premiums/discounts drive regional spreads.
                        </li>
                    </ul>
                </Card>

                <Card title="Focus (next 12–18 mo)" icon="🎯">
                    <ol className="list">
                        <li>Build AU NEM price & congestion model (5-min granularity).</li>
                        <li>Long-run LCOE stack with learning curves & WACC sensitivity.</li>
                        <li>Transmission queue + interconnector constraint mapping.</li>
                        <li>Battery arbitrage & FCAS strategy backtests.</li>
                    </ol>
                </Card>

                <Card title="KPIs" icon="🧭">
                    <div className="kpis">
                        <KPI label="Models shipped" value="3" sub="NEM, LCOE, Battery" />
                        <KPI label="Research notes" value="12" sub="Last 90 days" />
                        <KPI label="Hit rate" value="61%" sub="30D trade ideas" />
                    </div>
                </Card>

                <Card title="Quick links" icon="🔗">
                    <nav className="links">
                        <Link className="pill" href="/commodities" prefetch>
                            Commodities
                        </Link>
                        <Link className="pill" href="/models" prefetch>
                            Models
                        </Link>
                        <Link className="pill" href="/notes" prefetch>
                            Notes
                        </Link>
                        <Link className="pill" href="/future" prefetch>
                            Future Plan
                        </Link>
                    </nav>
                </Card>

                <Card title="Reading list" icon="📚">
                    <ul className="list">
                        <li>Grid congestion & marginal loss factors — AU case studies.</li>
                        <li>Battery revenue stacking in energy-only markets.</li>
                        <li>Permitting timelines vs. build-out rates (OECD/EM split).</li>
                        <li>Commodity capex cycles vs. price elasticities (Cu/Li/Ni).</li>
                    </ul>
                </Card>

                <Card title="Tools" icon="🧰">
                    <ul className="list">
                        <li>Python + Polars + DuckDB for ETL; Pyomo for optimisation.</li>
                        <li>Prisma + Postgres (RDS) for strategy metadata.</li>
                        <li>ECS tasks for backtests; S3 for artifacts.</li>
                    </ul>
                </Card>
            </section>

            <footer className="foot">
                <span className="footSymbol" aria-hidden>⚡</span>
                <span>Last updated {new Date().toISOString().slice(0, 10)}</span>
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
        .bolt {
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
        .list { 
          margin: 0; padding-left: 1.1em; 
        }
        .list li { margin: 6px 0; }
        .kpis {
          display: grid; grid-template-columns: repeat(12,1fr); gap: 12px;
        }
        .kpi { 
          grid-column: span 12; border: 1px dashed var(--rule); border-radius: 12px; padding: 12px;
        }
        .kpi strong { font-size: clamp(20px,3vw,28px); display:block; }
        .kpi small { color: var(--muted); }
        .links { display: flex; flex-wrap: wrap; gap: 8px; }
        .pill {
          display: inline-block; padding: 8px 12px; border-radius: 999px;
          background: var(--pill-bg); color: var(--pill-fg); text-decoration: none;
          border: 1px solid var(--rule);
        }
        .foot { 
          display:flex; gap:8px; align-items:center; justify-content:flex-end; 
          padding-top: 18px; border-top: 1px solid var(--rule); color: var(--muted);
          font-size: 12px;
        }
        .footSymbol { font-size: 14px; }

        /* Responsive spans */
        @media (min-width: 720px) {
          .card:nth-child(1) { grid-column: span 6; }
          .card:nth-child(2) { grid-column: span 6; }
          .card:nth-child(3) { grid-column: span 12; }
          .card:nth-child(4) { grid-column: span 12; }
          .card:nth-child(5) { grid-column: span 7; }
          .card:nth-child(6) { grid-column: span 5; }
          .kpi { grid-column: span 4; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .bolt { transform: none !important; }
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

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="kpi" role="group" aria-label={label}>
            <strong>{value}</strong>
            <div>
                <div>{label}</div>
                {sub ? <small>{sub}</small> : null}
            </div>
        </div>
    );
}
