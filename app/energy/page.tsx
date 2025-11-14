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
          <span className="bolt" role="img">
            ⚡
          </span>
        </div>
        <div className="titleBlock">
          <h1 id="energy-title">Energy</h1>
          <p className="tagline">
            A focused workspace for energy economics, power markets, and
            decarbonisation strategy — centred on an econometric energy dashboard
            that doubles as a prop-style trading research engine.
          </p>
        </div>
      </header>

      <section className="grid">
        {/* 1. Structural thesis */}
        <Card title="Thesis" icon="📈">
          <ul className="list">
            <li>
              <strong>Electrification + grids as the bottleneck:</strong> large,
              lumpy CAPEX cycles in generation, transmission, storage and flexibility.
              Grid congestion and policy design will drive regional price spreads.
            </li>
            <li>
              <strong>Gas, carbon and weather as key state variables:</strong> gas
              remains a balancing fuel this decade; carbon prices and weather regimes
              shape merit order and scarcity premia in power markets.
            </li>
            <li>
              <strong>Metals & supply-chain constraints:</strong> tightness in Cu/Li/Ni
              and permitting friction transmit into OEM margins and project timelines;
              this shows up in long-dated price expectations and volatility.
            </li>
            <li>
              <strong>Edge:</strong> structurally informed, transparent models that link
              fundamentals, policy and prices — used both for strategy work and prop-style
              trading research, not purely black-box ML.
            </li>
          </ul>
        </Card>

        {/* 2. System architecture / stack */}
        <Card title="System architecture" icon="🧠">
          <ul className="list">
            <li>
              <strong>Layer 1 — Data & infra:</strong> curated datasets for power, gas
              and carbon (prices, load, generation mix, weather indices, risk indices)
              stored in versioned tables (DuckDB/Postgres/Parquet) with reproducible ETL.
            </li>
            <li>
              <strong>Layer 2 — Forecast engine:</strong> VAR/SVAR/VECM and related
              econometric models producing level and spread forecasts with confidence
              intervals; regime tags (tight/loose, stress/normal), and mispricing signals
              (forecast vs market).
            </li>
            <li>
              <strong>Layer 3 — Strategy & risk:</strong> rule-based signal construction
              (directional and spread trades), risk-targeted position sizing, and portfolio
              constraints (per-market limits, factor caps, max leverage).
            </li>
            <li>
              <strong>Layer 4 — Execution & evaluation:</strong> honest backtests with
              costs and slippage, paper trading ledgers, and dashboards showing P&amp;L,
              Sharpe/Sortino, drawdowns, and regime-specific performance.
            </li>
            <li>
              <strong>Stack:</strong> Python + Polars/DuckDB for ETL; statsmodels/ML for
              models; simple FastAPI service for forecasts; dashboard UI (e.g. Dash/React)
              as the front door.
            </li>
          </ul>
        </Card>

        {/* 3. Roadmap (near-term & medium-term) */}
        <Card title="Roadmap" icon="🗺️">
          <ol className="list">
            <li>
              <strong>Now → 2026 (Foundations):</strong> ship V0/V1 of the European
              power/commodities dashboard with clean pipelines, baseline VAR/VECM
              models, and at least one simple backtested strategy (e.g. mean-reverting
              spread) running in a paper-trading sandbox.
            </li>
            <li>
              <strong>MSc window (2027–2029):</strong> evolve the platform into a
              research-grade forecasting and scenario tool for European power/gas,
              embed it in MSc thesis work, and test whether structurally informed
              strategies generate robust, net-of-costs excess returns.
            </li>
            <li>
              <strong>Early career (2029–2036):</strong> keep the system as a
              practitioner-research lab — improving models, risk frameworks and
              evaluation — while using the insights in corporate/ESG/strategy roles
              and, where appropriate, tightly governed personal trading.
            </li>
            <li>
              <strong>Long term (2036+):</strong> the platform underpins senior
              strategy and policy work as a scenario engine and risk lab, whether or
              not it’s used for active trading at scale.
            </li>
          </ol>
        </Card>

        {/* 4. Trading & risk framework */}
        <Card title="Trading & risk framework" icon="🎛️">
          <ul className="list">
            <li>
              <strong>Role in the plan:</strong> prop-style trading is a{" "}
              <em>layer</em> on top of the dashboard — a research and risk discipline
              tool — not the sole career goal.
            </li>
            <li>
              <strong>Alpha construction:</strong> use forecast–price gaps, regime
              tags, and structural signals (e.g. weather, fuel spreads, carbon) to
              define directional and spread strategies in liquid futures (power, gas,
              carbon, FX indices as needed).
            </li>
            <li>
              <strong>Risk constraints:</strong> explicit caps on per-market exposure,
              total portfolio volatility, and drawdown; hard stop-loss rules and
              guardrails against overfitting (walk-forward tests, out-of-sample
              validation).
            </li>
            <li>
              <strong>Implementation path:</strong> start with offline backtests →
              paper trading with realistic costs → only small real capital later, and
              only when compliant with employer and regulatory constraints.
            </li>
            <li>
              <strong>Success definition:</strong> robust, explainable strategies
              with attractive risk-adjusted returns and controlled drawdowns over
              long samples — even if capital deployed remains modest.
            </li>
          </ul>
        </Card>

        {/* 5. KPIs for the dashboard & strategy */}
        <Card title="KPIs" icon="🧭">
          <div className="kpis">
            <KPI
              label="Models in production"
              value="3"
              sub="Core VAR/VECM + 1 regime model"
            />
            <KPI
              label="Forecast quality"
              value="≤ X%"
              sub="1M MAE vs realised (per key contract)"
            />
            <KPI
              label="Strategy performance"
              value="> 1.0"
              sub="Target backtested Sharpe, sane drawdown"
            />
          </div>
          <ul className="list" style={{ marginTop: "10px" }}>
            <li>
              <strong>Process KPIs:</strong> data pipeline uptime, % of code covered by
              tests, number of clearly documented strategies (with post-mortems).
            </li>
            <li>
              <strong>Research cadence:</strong> regular research notes (x/year)
              summarising model changes, failures, and new hypotheses.
            </li>
          </ul>
        </Card>

        {/* 6. Navigation / quick links */}
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
      </section>

      <footer className="foot">
        <span className="footSymbol" aria-hidden>
          ⚡
        </span>
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
        {icon ? (
          <span className="cardIcon" aria-hidden>
            {icon}
          </span>
        ) : null}
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