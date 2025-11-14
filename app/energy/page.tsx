// app/energy/page.tsx
// Server component. Contrast-safe via system colors (Canvas/CanvasText/LinkText).
// Minimalist layout; big symbol; airy spacing. No client hooks required.

import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Energy",
  description:
    "Energy & commodities hub — data, strategies, hypotheses, tools, links, and KPIs",
};

export default function EnergyPage() {
  return (
    <main className="wrap">
      <header className="hero" aria-labelledby="energy-title">
        <div className="symbol">
          <span className="bolt" role="img" aria-label="Energy">
            ⚡
          </span>
        </div>
        <div className="titleBlock">
          <h1 id="energy-title">Energy</h1>
          <p className="tagline">
            A focused workspace for energy economics, power markets, and
            decarbonisation strategy — centred on a shared data backbone and
            econometric dashboard that doubles as a prop-style trading research engine.
          </p>
        </div>
      </header>

      <section className="grid">
        {/* 1. Data backbone */}
        <Card title="Data backbone" icon="🧾">
          <p>
            All dashboards and strategies sit on one shared, versioned dataset. The
            priority is European power, gas and carbon, with a clear path to adding
            more markets over time.
          </p>
          <ul className="list">
            <li>
              <strong>Market prices & curves:</strong> power, gas, coal and carbon
              spot/forward curves (by zone, hub and tenor); key FX and macro indices
              for translation and overlay.
            </li>
            <li>
              <strong>Load, generation & outages:</strong> system load and forecasts,
              generation mix by technology, plant outages and availability, unit-level
              data where possible.
            </li>
            <li>
              <strong>Grid & congestion:</strong> transmission capacities, realised
              flows, interconnector utilisation, redispatch / constraint costs, and
              basic network topology by zone/region.
            </li>
            <li>
              <strong>Weather & hydro:</strong> HDD/CDD indices, wind and solar
              output/forecasts, hydro inflows and reservoir levels, plus simple
              climate/seasonal tags.
            </li>
            <li>
              <strong>Storage & fuel balances:</strong> gas storage levels, injection/
              withdrawal rates, inventories, LNG flows, and simple fuel balance
              indicators.
            </li>
            <li>
              <strong>Policy & regulation:</strong> ETS parameters, plant closure /
              subsidy / market-design events, capacity mechanisms, carbon border
              measures, and other tagged policy changes.
            </li>
            <li>
              <strong>Geopolitics & risk:</strong> tagged energy-relevant events
              (sanctions, conflict escalations, pipeline incidents, OPEC+/LNG actions)
              and coarse “tension regime” indicators.
            </li>
            <li>
              <strong>Metadata & quality:</strong> source coverage, lags, revisions,
              flags for missing/cleaned data, and versioned ETL in DuckDB/Postgres/
              Parquet.
            </li>
          </ul>
        </Card>

        {/* 2. Structural thesis */}
        <Card title="Thesis" icon="📈">
          <ul className="list">
            <li>
              <strong>Electrification + grids as the bottleneck:</strong> demand for
              electricity rises via EVs, heat and electrified industry, but grids and
              flexibility build out in slow, lumpy CAPEX cycles. Congestion and market
              design drive persistent regional spreads and volatility.
            </li>
            <li>
              <strong>Gas, carbon, weather & geopolitics as state variables:</strong>{" "}
              gas remains a balancing fuel this decade; carbon policy reshapes the
              merit order; weather regimes and hydro conditions amplify stress; and
              geopolitics periodically reprices the entire fuel complex and volatility
              surface.
            </li>
            <li>
              <strong>Metals & supply-chain constraints:</strong> tightness in copper,
              lithium, nickel and permitting/logistics frictions limit the speed of the
              transition. This shows up in long-dated curves, project timing and
              implied volatility rather than just spot prices.
            </li>
            <li>
              <strong>Edge:</strong> structurally informed, transparent models that
              link fuels, power, carbon, weather, grids and geopolitics into a small
              set of factors and regimes — used both for strategy work and prop-style
              trading research, not purely black-box ML.
            </li>
          </ul>
        </Card>

        {/* 3. Strategy complexes: background & role */}
        <Card title="Strategy complexes" icon="🎯">
          <p>
            The dashboard hosts a small set of “strategy complexes” that are both
            serious portfolio tools and candidates for prop-style trading. Each has a
            clear background, hypotheses and implementation path.
          </p>
          <ul className="list">
            <li>
              <strong>1. Generation Stack RV (spark / dark & fuel-switching):</strong>{" "}
              models the economics of running gas and coal plants under different fuel
              and carbon prices; used to value clean spark/dark spreads, understand
              policy impacts on generators, and trade mispricing between power, gas,
              coal and carbon baskets.
            </li>
            <li>
              <strong>2. Regional Basis & Congestion (grid & location risk lab):</strong>{" "}
              focuses on price differences between zones and countries connected by the
              grid, driven by transmission limits, local weather, generation mix and
              policy; supports decisions on siting, PPAs and hedging, and enables
              mean-reverting or trend-following trades in regional spreads.
            </li>
            <li>
              <strong>3. Curve & Storage (seasonal / calendar spreads):</strong> treats
              the shape of power and gas forward curves as a reflection of storage
              levels, seasonal demand, investment pipelines and perceived long-run
              equilibrium; used to place seasonal hedges and to trade curve steepness
              and roll-down where fundamentals support it.
            </li>
            <li>
              <strong>4. Policy & Geopolitical Events (event lab):</strong> builds a
              tagged history of policy and geopolitical shocks (ETS reforms, sanctions,
              pipeline incidents, conflict, plant closure mandates) and studies how
              prices, spreads and curves typically react and mean-revert; used both to
              stress-test portfolios and to design cautious event-driven trades.
            </li>
            <li>
              <strong>5. Transition & Carbon Curve (transition scenario engine):</strong>{" "}
              links explicit decarbonisation scenarios (fast / slow / disorderly) to
              carbon price paths and long-dated power/gas curves; informs corporate
              transition risk views and supports slower-moving, structural trades in
              back-end curves and carbon-power relative value.
            </li>
          </ul>
        </Card>

        {/* 4. Hypotheses & strategy specs */}
        <Card title="Hypotheses & strategies" icon="🧪">
          <p>
            Each complex is grounded in explicit hypotheses about how fundamentals,
            policy and geopolitics transmit into prices. Strategies are simply rules
            for turning those hypotheses into positions with disciplined risk.
          </p>
          <ul className="list">
            <li>
              <strong>H1 — Generation stack mispricing:</strong> given fuel, carbon and
              plant-efficiency assumptions, observed clean spark/dark spreads often
              deviate from “fair value” in predictable ways, especially outside crisis
              regimes.
              <br />
              <em>Strategy:</em> use VAR/VECM and cost models to estimate fair-value
              spreads; when forecast–price gaps exceed a threshold, take balanced
              power–fuel–carbon baskets that fade back toward fair value, with tight
              risk limits and regime filters.
            </li>
            <li>
              <strong>H2 — Regional basis and congestion regimes:</strong> regional
              power spreads are largely explained by fuel costs, load, weather,
              transmission limits and policy, but tend to overshoot during congestion
              and then mean-revert once stress normalises.
              <br />
              <em>Strategy:</em> model fair regional spreads as a function of those
              drivers; go long cheap zones / short expensive ones when deviations are
              large and flows/constraints suggest reversion, or ride regime shifts when
              structural changes (e.g. new interconnectors, plant closures) reset the
              equilibrium.
            </li>
            <li>
              <strong>H3 — Curve shape & storage carry:</strong> the shape of gas/power
              curves reflects seasonal risk, storage and investment expectations; front
              contracts can overreact to shocks relative to the back, creating
              predictable roll-down opportunities once balances normalise.
              <br />
              <em>Strategy:</em> estimate equilibrium seasonal/calendar spreads given
              storage, weather and policy regimes; take structural long/short positions
              in curve shape where roll-down plus fundamentals compensate for costs and
              risk.
            </li>
            <li>
              <strong>H4 — Policy & geopolitical event patterns:</strong> tagged policy
              and geopolitical shocks (sanctions, ETS reforms, pipeline incidents) have
              repeatable pre- and post-event patterns in levels, spreads and
              volatility, with a mix of overreaction and underreaction depending on
              event type and regime.
              <br />
              <em>Strategy:</em> maintain event-study statistics; around new events,
              use playbooks that either fade extreme dislocations back toward
              fundamentals or cautiously hold continuation trades where history shows
              persistent repricing — always with small size and explicit stop rules.
            </li>
            <li>
              <strong>H5 — Transition & carbon–power misalignment:</strong> long-dated
              power/gas curves do not always co-move consistently with plausible carbon
              price and policy paths, leading to under- or over-pricing of transition
              risk.
              <br />
              <em>Strategy:</em> build scenario-driven fair curves under different
              transition paths; trade carbon vs power/gas (or front vs back) when
              markets diverge materially from scenario-consistent ranges, with
              multi-year horizons and low leverage.
            </li>
          </ul>
        </Card>

        {/* 5. Overlap, factor model & portfolio view */}
        <Card title="Shared model & overlap" icon="🧬">
          <p>
            All strategies share the same data backbone and factor/regime models. The
            dashboard is a portfolio lab, not a pile of unrelated trades.
          </p>
          <ul className="list">
            <li>
              <strong>Common factor layer:</strong> define a small set of transparent
              factors — fuels, carbon, weather, grid stress, storage, geopolitics/
              policy, macro/FX — and explain prices, spreads and curves in terms of
              these. Strategy signals live mostly in residuals and forecast–price
              gaps.
            </li>
            <li>
              <strong>Econometric toolkit:</strong> reuse VAR/SVAR/VECM, error-
              correction, regime models and event studies across complexes, rather than
              bespoke models per strategy. One forecast engine, many expressions.
            </li>
            <li>
              <strong>Signal reuse & correlation:</strong> track which strategies use
              the same underlying signals to avoid fake diversification; cluster
              strategies into complexes and manage risk at the complex and factor
              level.
            </li>
            <li>
              <strong>Portfolio dashboard:</strong> show exposure by market, factor
              and regime; P&amp;L contributions by complex; and stress tests for key
              scenarios (fuel shocks, policy shifts, weather extremes, geopolitical
              escalations).
            </li>
            <li>
              <strong>Career integration:</strong> the same structures that support
              prop-style research (signals, residuals, backtests) also support
              corporate/ESG/policy work (scenario analysis, risk decomposition,
              location and transition insights).
            </li>
          </ul>
        </Card>

        {/* 6. System architecture & roadmap */}
        <Card title="System architecture & roadmap" icon="🧠">
          <ul className="list">
            <li>
              <strong>Layer 1 — Data & infra:</strong> curated datasets for power, gas,
              carbon and related fundamentals stored in versioned tables (DuckDB/
              Postgres/Parquet) with reproducible ETL and basic data-quality KPIs.
            </li>
            <li>
              <strong>Layer 2 — Forecast & factor engine:</strong> VAR/SVAR/VECM and
              related econometric models for levels, spreads and curves, plus a factor
              model tying everything to fuels, carbon, weather, grids, storage and
              geopolitics; outputs include forecasts, confidence intervals, regimes and
              mispricing signals.
            </li>
            <li>
              <strong>Layer 3 — Strategy & risk:</strong> rule-based signal
              construction for each complex; risk-targeted position sizing; constraints
              on per-market exposure, factor exposure, volatility and drawdown; and
              clear implementation paths (backtest → paper → small real capital, where
              compliant).
            </li>
            <li>
              <strong>Layer 4 — Execution & evaluation:</strong> honest backtests with
              costs and slippage, paper trading ledgers, and dashboards showing P&amp;L,
              Sharpe/Sortino, drawdowns and regime-specific performance, alongside
              scenario outputs for corporate/ESG/policy use.
            </li>
            <li>
              <strong>Stack:</strong> Python + Polars/DuckDB for ETL; statsmodels/ML
              for models; simple FastAPI service for forecasts and signals; dashboard
              UI (Dash/React/Next.js) as the front door.
            </li>
            <li>
              <strong>Roadmap — Now → 2026 (Foundations):</strong> build the data
              backbone, factor layer and at least one simple implementation of each
              core complex (generation stack, basis, curve, events, transition) with
              clean pipelines and baseline VAR/VECM models; run everything in a
              paper-trading sandbox.
            </li>
            <li>
              <strong>Roadmap — MSc window (2027–2029):</strong> evolve the platform
              into a research-grade forecasting and scenario tool; embed it in MSc
              thesis work; and test whether structurally informed strategies produce
              robust, net-of-costs excess returns across markets and regimes.
            </li>
            <li>
              <strong>Roadmap — Early career (2029–2036):</strong> keep the system as a
              practitioner-research lab — improving models, risk frameworks and
              evaluation — while using insights in corporate/ESG/strategy roles and,
              where appropriate, tightly governed personal trading.
            </li>
            <li>
              <strong>Roadmap — Long term (2036+):</strong> the platform underpins
              senior strategy and policy work as a scenario engine and risk lab,
              whether or not it is used for active trading at scale.
            </li>
          </ul>
        </Card>

        {/* 7. KPIs & navigation */}
        <Card title="KPIs & navigation" icon="🧭">
          <div className="kpis">
            <KPI
              label="Core complexes live"
              value="5"
              sub="Stack, basis, curve, events, transition"
            />
            <KPI
              label="Models in production"
              value="3+"
              sub="VAR/VECM + 1–2 regime / factor models"
            />
            <KPI
              label="Forecast quality"
              value="≤ X%"
              sub="1M MAE vs realised (per key contract)"
            />
            <KPI
              label="Strategy performance"
              value="&gt; 1.0"
              sub="Target backtested Sharpe, sane drawdowns"
            />
            <KPI
              label="Research cadence"
              value="x / year"
              sub="Notes with model changes & post-mortems"
            />
          </div>
          <ul className="list" style={{ marginTop: "10px" }}>
            <li>
              <strong>Process KPIs:</strong> data pipeline uptime, % of code covered by
              tests, number of clearly documented strategies (with post-mortems), and
              time from idea → prototype → backtest → paper.
            </li>
            <li>
              <strong>Risk KPIs:</strong> realised vs target volatility, drawdowns by
              complex, factor exposure limits, and performance by regime and event type.
            </li>
            <li>
              <strong>Career KPIs:</strong> number of research notes, thesis chapters
              and presentations built from the platform; number of concrete corporate/
              ESG/strategy decisions informed by its outputs.
            </li>
          </ul>
          <nav className="links">
            <Link className="pill" href="/commodities">
              Commodities
            </Link>
            <Link className="pill" href="/models">
              Models
            </Link>
            <Link className="pill" href="/strategies">
              Strategies
            </Link>
            <Link className="pill" href="/notes">
              Notes
            </Link>
            <Link className="pill" href="/future">
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
          margin-bottom: 12px;
        }
        .kpi { 
          grid-column: span 12; border: 1px dashed var(--rule); border-radius: 12px; padding: 12px;
        }
        .kpi strong { font-size: clamp(20px,3vw,28px); display:block; }
        .kpi small { color: var(--muted); }
        .links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
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

function KPI({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
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