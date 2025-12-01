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
          <p className="sectionLabel">Energy</p>
          <h1 id="energy-title">Energy &amp; commodities hub.</h1>
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

        {/* 7. Codebase layout & modules */}
        <Card title="Codebase layout & modules" icon="📂">
          <p>
            One Python package and one Next.js app, structured by region (EU/AU) and
            by the four layers. This is the canonical map when wiring new code.
          </p>
          <ul className="list">
            <li>
              <strong>Python package:</strong>{" "}
              <code>energy/</code> with:
              <ul>
                <li>
                  <code>core/</code> — shared logic, split into{" "}
                  <code>l1_data</code>, <code>l2_forecast</code>,{" "}
                  <code>l3_strategy</code>, <code>l4_execution</code> modules.
                </li>
                <li>
                  <code>eu/</code> — Europe-specific{" "}
                  <code>l1_data/etl_*</code>, <code>l2_forecast/factors_eu.py</code>{" "}
                  &amp; model files, <code>l3_strategy/strategies_*.py</code>,{" "}
                  <code>l4_execution/backtests_eu.py</code>.
                </li>
                <li>
                  <code>au/</code> — Australia-specific ETL for NEM/ASX, AU factors &amp;
                  regimes, AU strategies and backtests in the same four-layer layout.
                </li>
                <li>
                  <code>api/</code> — FastAPI routers per layer:{" "}
                  <code>l1_data_api.py</code>, <code>l2_forecast_api.py</code>,{" "}
                  <code>l3_strategy_api.py</code>, <code>l4_execution_api.py</code>.
                </li>
              </ul>
            </li>
            <li>
              <strong>Layer mapping in code:</strong>{" "}
              <code>core/l1_data</code> handles DB/storage &amp; QC;{" "}
              <code>core/l2_forecast</code> wraps VAR/VECM &amp; factor builders;{" "}
              <code>core/l3_strategy</code> holds signal/portfolio/risk helpers;{" "}
              <code>core/l4_execution</code> runs backtests, P&amp;L and reports.
            </li>
            <li>
              <strong>Front-end (Next.js):</strong>{" "}
              <code>dash/app/</code> with:
              <ul>
                <li>
                  <code>l1-data/eu</code> &amp; <code>l1-data/au</code> — data &amp; infra
                  dashboards.
                </li>
                <li>
                  <code>l2-forecast/eu</code> &amp; <code>l2-forecast/au</code> —
                  factors, regimes, forecast vs realised.
                </li>
                <li>
                  <code>l3-strategy/eu</code> &amp; <code>l3-strategy/au</code> —
                  strategy complexes, signals, targets.
                </li>
                <li>
                  <code>l4-execution/eu</code> &amp; <code>l4-execution/au</code> —
                  backtests, P&amp;L, drawdowns and regime buckets.
                </li>
              </ul>
            </li>
            <li>
              <strong>Shared UI components:</strong>{" "}
              <code>dash/app/components/</code> for{" "}
              <code>RegionSelector</code>, <code>LayerTabs</code>,{" "}
              <code>FactorHeatmap</code>, <code>RegimeTimeline</code>,{" "}
              <code>StrategyTable</code>, <code>PerformanceChart</code>.
            </li>
          </ul>
        </Card>

        {/* 8. AWS backbone & deployment */}
        <Card title="AWS backbone & deployment" icon="☁️">
          <p>
            AWS is the storage and compute grid under the four logical layers. Aim for
            a small, opinionated stack that is cheap to run and easy to extend.
          </p>
          <ul className="list">
            <li>
              <strong>Region & network:</strong> primary in{" "}
              <code>ap-southeast-2</code> (Sydney) with a single VPC; private subnets
              for databases and ECS/Fargate, public subnets only for load balancers /
              CloudFront origins. Optional EU footprint later if data residency is
              needed.
            </li>
            <li>
              <strong>Layer 1 — Data & infra:</strong> S3 as the data lake for{" "}
              <code>raw/</code> and <code>clean/</code> Parquet; Lambda + ECS Fargate
              (and optionally Step Functions) for ETL; EventBridge for crons; DynamoDB
              or Aurora Postgres for dataset metadata, coverage and QC KPIs.
            </li>
            <li>
              <strong>Layer 2 — Forecast & factors:</strong> containerised Python
              (statsmodels, Polars, DuckDB) on ECS Fargate or AWS Batch for model
              runs; outputs (factors, forecasts, regimes) written back to S3 and/or
              Aurora/Redshift; FastAPI L2 endpoints exposed via API Gateway or an
              internal ALB.
            </li>
            <li>
              <strong>Layer 3 — Strategy & risk:</strong> FastAPI service on ECS or
              Lambda using L2 outputs to compute signals and targets; Aurora Postgres
              or DynamoDB for strategy configs, risk limits and current targets; S3 for
              historical signal archives.
            </li>
            <li>
              <strong>Layer 4 — Execution & evaluation:</strong> backtests and
              simulations on AWS Batch/ECS; positions, trades and P&amp;L stored in S3
              (detail) plus Aurora (summaries); FastAPI L4 endpoints for retrieving
              backtest runs, equity curves, regime-bucket performance, etc.
            </li>
            <li>
              <strong>Front door:</strong> Next.js dashboard built in CI and deployed
              to either AWS Amplify or S3 + CloudFront. UI talks only to the versioned
              layer APIs, not directly to data stores.
            </li>
            <li>
              <strong>Cross-cutting:</strong> IAM roles per service (least-privilege
              access to S3 buckets and databases); Secrets Manager / SSM for API keys
              and DB creds; CloudWatch Logs &amp; Metrics for ETL and API health;
              CloudWatch Alarms on feed staleness, error rates and key KPIs.
            </li>
          </ul>
        </Card>

        {/* 9. L1–L4 data map & APIs */}
        <Card title="L1–L4 data map & APIs" icon="🧵">
          <p>
            Working map from the four logical layers into concrete datasets and APIs.
            Use as a reference when wiring ETL jobs and FastAPI routers.
          </p>
          <ul className="list">
            <li>
              <strong>Layer 1 — Data & infra:</strong> pulls external feeds into
              versioned tables in S3/DuckDB/Postgres.
              <ul>
                <li>
                  <strong>EU power:</strong> ENTSO-E Transparency API for load,
                  generation, day-ahead prices, outages, cross-border flows, hydro.
                </li>
                <li>
                  <strong>EU gas &amp; storage:</strong> ENTSOG Transparency API for
                  flows &amp; capacity; GIE AGSI+/ALSI for storage &amp; LNG.
                </li>
                <li>
                  <strong>AU power (NEM):</strong> AEMO Nemweb CSVs + OpenElectricity
                  JSON API.
                </li>
                <li>
                  <strong>Weather &amp; hydro:</strong> Copernicus CDS (ERA5, HDD/CDD)
                  + Open-Meteo forecasts + ENTSO-E hydro reservoir series.
                </li>
                <li>
                  <strong>Policy &amp; ETS:</strong> EU ETS data viewer exports +
                  EUR-Lex/Cellar APIs for tagged legal events.
                </li>
                <li>
                  <strong>Geopolitics &amp; risk:</strong> GDELT v2 events &amp; DOC
                  APIs, optional sanctions API, UN/Eurostat/ECB macro/FX.
                </li>
              </ul>
            </li>
            <li>
              <strong>Layer 2 — Forecast & factors:</strong> no new external data;
              builds forecast &amp; factor tables on top of L1.
              <ul>
                <li>
                  VAR/VECM/SVAR models for prices, spreads, curves, load, generation.
                </li>
                <li>
                  Factor tables for fuels, carbon, weather, grid stress, storage,
                  geopolitics, macro/FX.
                </li>
                <li>
                  Outputs: forecasts, confidence intervals, regime labels, mispricing
                  estimates.
                </li>
              </ul>
            </li>
            <li>
              <strong>Layer 3 — Strategy & risk:</strong> internal-only; consumes L2
              outputs.
              <ul>
                <li>
                  Signal tables per complex (stack, basis, curve, events, transition).
                </li>
                <li>
                  Risk configs &amp; limits, target positions and portfolio views.
                </li>
              </ul>
            </li>
            <li>
              <strong>Layer 4 — Execution & evaluation:</strong> backtests and
              performance analytics.
              <ul>
                <li>
                  Simulated trades, positions, P&amp;L, drawdowns, regime attribution.
                </li>
                <li>
                  All on top of L3 signals; no new external data.
                </li>
              </ul>
            </li>
          </ul>
        </Card>

        {/* 10. L1 data sources & endpoints */}
        <Card title="L1 data sources & endpoints" icon="🌍">
          <p>
            Concrete, free-first data plan for the L1 backbone. Use this as a checklist
            when implementing <code>core/l1_data</code> and{" "}
            <code>api/l1_data_api.py</code>.
          </p>
          <ul className="list">
            <li>
              <strong>EU power — ENTSO-E Transparency Platform</strong>
              <ul>
                <li>
                  Base URL: <code>https://web-api.tp.entsoe.eu/api</code>
                </li>
                <li>
                  Auth: <code>?securityToken=YOUR_TOKEN</code> (free key).
                </li>
                <li>
                  Day-ahead prices: <code>documentType=A44</code>,{" "}
                  <code>in_Domain/out_Domain</code> = bidding zone EIC codes,{" "}
                  <code>periodStart/periodEnd=YYYYMMDDHHMM</code>.
                </li>
                <li>
                  Load &amp; load forecast: <code>documentType=A65/A71</code>.
                </li>
                <li>
                  Generation by type: <code>documentType=A73/A75</code>.
                </li>
                <li>
                  Cross-border flows &amp; capacity: <code>documentType=A11/A12</code>.
                </li>
                <li>
                  Water reservoirs / hydro storage: <code>documentType=A72</code>.
                </li>
              </ul>
            </li>
            <li>
              <strong>EU gas — ENTSOG Transparency Platform</strong>
              <ul>
                <li>
                  Base: <code>https://transparency.entsog.eu/api/v1/</code>
                </li>
                <li>
                  Example: <code>operationalData.json</code> with query params{" "}
                  <code>from</code>, <code>to</code>, <code>indicator</code>{" "}
                  (e.g. <code>PhysicalFlow</code>), <code>pointKey</code>,{" "}
                  <code>direction</code>.
                </li>
                <li>
                  Use for physical flows, nominations, technical &amp; firm capacity.
                </li>
                <li>No API key required for standard public usage.</li>
              </ul>
            </li>
            <li>
              <strong>EU storage &amp; LNG — GIE AGSI+ / ALSI</strong>
              <ul>
                <li>
                  Storage: <code>https://agsi.gie.eu/api</code>
                </li>
                <li>
                  LNG: <code>https://alsi.gie.eu/api</code>
                </li>
                <li>
                  Auth: <code>?apikey=YOUR_KEY</code> (shared <code>GIE_API_KEY</code>).
                </li>
                <li>
                  Example:{" "}
                  <code>
                    ?type=eu&amp;from=YYYY-MM-DD&amp;to=YYYY-MM-DD&amp;apikey=...
                  </code>{" "}
                  for EU aggregates; <code>?facility=ID</code> for facility-level.
                </li>
              </ul>
            </li>
            <li>
              <strong>AU power — AEMO Nemweb + OpenElectricity</strong>
              <ul>
                <li>
                  Nemweb: structured CSV directories under{" "}
                  <code>https://nemweb.com.au/Reports/Current/</code> (e.g.{" "}
                  <code>Dispatch_SCADA</code>, <code>PRICE</code>,{" "}
                  <code>TRADING_IS</code>).
                </li>
                <li>
                  ETL pattern: scheduled download, unzip, normalise to Parquet in{" "}
                  <code>s3://.../raw/nemweb/</code>.
                </li>
                <li>
                  OpenElectricity API: e.g.{" "}
                  <code>
                    https://api.opennem.org.au/v3/stats/au/NEM/fueltech/energy:all
                  </code>{" "}
                  with <code>?period=7d</code>, <code>?group=interval</code> options
                  and <code>OPENELECTRICITY_API_KEY</code> set.
                </li>
              </ul>
            </li>
            <li>
              <strong>Weather, RES &amp; climate — CDS + Open-Meteo + NOAA</strong>
              <ul>
                <li>
                  ERA5 via <code>cdsapi</code> Python client; dataset name{" "}
                  <code>"reanalysis-era5-single-levels"</code>, variables like{" "}
                  <code>2m_temperature</code>, <code>10m_wind</code>. Uses{" "}
                  <code>CDS_API_URL</code> and <code>CDS_API_KEY</code>.
                </li>
                <li>
                  HDD/CDD via C3S HDD/CDD datasets or toolbox; store as daily indices
                  per region.
                </li>
                <li>
                  Open-Meteo forecasts:{" "}
                  <code>https://api.open-meteo.com/v1/forecast</code> with{" "}
                  <code>latitude</code>, <code>longitude</code>,{" "}
                  <code>hourly=...</code>, <code>forecast_days</code> — no key
                  required.
                </li>
                <li>
                  NOAA/NCEI CDO via <code>NOAA_TOKEN</code> for station-based
                  observations where needed.
                </li>
              </ul>
            </li>
            <li>
              <strong>Policy &amp; ETS — EU ETS &amp; EUR-Lex/Cellar</strong>
              <ul>
                <li>
                  EU ETS: yearly CSV/Excel exports from the EU ETS Data Viewer; ingest
                  into <code>l1_data</code> with fields for country, sector, emissions,
                  allowances.
                </li>
                <li>
                  EUR-Lex/Cellar: SRU/REST interface, e.g.{" "}
                  <code>/sru?operation=searchRetrieve&amp;query=...</code> for querying
                  documents with keywords like &quot;emissions trading&quot;, &quot;capacity
                  mechanism&quot;, &quot;CBAM&quot;.
                </li>
                <li>
                  Store as a <code>policy_events</code> table with IDs, dates, tags and
                  text snippets.
                </li>
              </ul>
            </li>
            <li>
              <strong>Geopolitics &amp; risk — GDELT</strong>
              <ul>
                <li>
                  DOC 2.0 API:{" "}
                  <code>https://api.gdeltproject.org/api/v2/doc/doc</code> with{" "}
                  <code>?query=...</code>, <code>?mode=ArtList</code>,{" "}
                  <code>?maxrecords</code>, <code>?format=json</code>.
                </li>
                <li>
                  Use queries like <code>pipeline AND explosion</code> or{" "}
                  <code>gas AND sanctions</code> to tag events.
                </li>
                <li>
                  Aggregate to daily/weekly &quot;tension&quot; indices by region/fuel.
                </li>
                <li>No API key required.</li>
              </ul>
            </li>
            <li>
              <strong>FX &amp; macro — ECB &amp; Eurostat</strong>
              <ul>
                <li>
                  ECB SDMX: e.g.{" "}
                  <code>
                    https://data.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A
                  </code>{" "}
                  for USD/EUR daily reference rate.
                </li>
                <li>
                  Eurostat SDMX3: e.g.{" "}
                  <code>https://api.europa.eu/eurostat/data/sdg_08_10</code> with{" "}
                  <code>?time</code>, <code>?geo</code>.
                </li>
                <li>
                  Use for CPI, industrial output, etc. as slow-moving factors. No keys
                  required.
                </li>
              </ul>
            </li>
            <li>
              <strong>Global/US energy — EIA</strong>
              <ul>
                <li>
                  EIA API via <code>EIA_API_KEY</code> for US and some global energy
                  balances, storage, prices.
                </li>
              </ul>
            </li>
          </ul>
        </Card>

        {/* 11. API keys & auth status (current) */}
        <Card title="API keys & auth status" icon="🔐">
          <p>
            Snapshot of which keys are already wired into the platform vs. which feeds
            are key-less or still optional. Use this as a quick checklist while
            building <code>core/l1_data</code> and infra.
          </p>
          <ul className="list">
            <li>
              <strong>Configured keys (in all environments):</strong>
              <ul>
                <li>
                  <code>EIA_API_KEY</code> — US/global energy fundamentals (EIA).
                </li>
                <li>
                  <code>ENTSOE_TOKEN</code> — EU power (ENTSO-E Transparency).
                </li>
                <li>
                  <code>GIE_API_KEY</code> — shared AGSI+/ALSI access for EU gas
                  storage &amp; LNG.
                </li>
                <li>
                  <code>CDS_API_URL</code>, <code>CDS_API_KEY</code> — Copernicus CDS
                  (ERA5, HDD/CDD, climate).
                </li>
                <li>
                  <code>NOAA_TOKEN</code> — NOAA/NCEI CDO weather &amp; climate.
                </li>
                <li>
                  <code>OPENELECTRICITY_API_KEY</code> — AU/NEM via OpenElectricity.
                </li>
                <li>
                  <code>AI_GATEWAY_API_KEY</code> — AI gateway for research tools.
                </li>
                <li>
                  <code>S3_BUCKET</code> — primary data lake bucket.
                </li>
                <li>
                  <code>DATABASE_URL</code> — primary DB (metadata, configs, dashboards).
                </li>
                <li>
                  <code>SQS_RESEARCH_JOBS_URL</code> — queue for research/ETL jobs.
                </li>
                <li>
                  <code>AUTH_RESEARCHERS</code> — access control / allowlist for
                  dashboards and APIs.
                </li>
              </ul>
            </li>
            <li>
              <strong>Key-less feeds (no env secret required):</strong>
              <ul>
                <li>
                  <strong>ENTSOG Transparency:</strong> gas flows &amp; capacity via
                  public API.
                </li>
                <li>
                  <strong>GDELT:</strong> geopolitics &amp; news events.
                </li>
                <li>
                  <strong>Open-Meteo:</strong> forecast weather.
                </li>
                <li>
                  <strong>ECB / Eurostat:</strong> FX &amp; macro SDMX APIs.
                </li>
                <li>
                  <strong>AEMO Nemweb:</strong> NEM CSV reports.
                </li>
                <li>
                  <strong>EU ETS Data Viewer / EUR-Lex / Cellar:</strong> policy &amp;
                  ETS docs via downloads/REST.
                </li>
              </ul>
            </li>
            <li>
              <strong>Optional / future keys (not configured yet):</strong>
              <ul>
                <li>
                  <code>FRED_API_KEY</code> — if US macro/financial series from FRED
                  become useful.
                </li>
                <li>
                  <code>OPENWEATHER_API_KEY</code> — if a city-centric weather API is
                  needed in addition to CDS/NOAA/Open-Meteo.
                </li>
                <li>
                  Any future specialist commodity/FX APIs can be added here as the
                  platform grows.
                </li>
              </ul>
            </li>
          </ul>
        </Card>

        {/* 12. Budget & costs */}
        <Card title="Budget & costs (≤ $50/month)" icon="💸">
          <p>
            Working budget for a free-data, infra-limited implementation. All external
            data licences are free; the monthly spend is primarily AWS.
          </p>
          <table className="budget">
            <thead>
              <tr>
                <th>Component</th>
                <th>Assumption</th>
                <th>Est. monthly (AUD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data licences</td>
                <td>
                  ENTSO-E, ENTSOG, GIE, AEMO, OpenElectricity, CDS, GDELT, ECB,
                  Eurostat (free tiers)
                </td>
                <td>$0</td>
              </tr>
              <tr>
                <td>S3 storage</td>
                <td>200–400 GB, lifecycle to cheaper storage for old data</td>
                <td>$3–8</td>
              </tr>
              <tr>
                <td>Lambda ETL</td>
                <td>Feed pulls &amp; light transforms (few thousand invokes/day)</td>
                <td>$1–5</td>
              </tr>
              <tr>
                <td>ECS Fargate / Batch</td>
                <td>Nightly VAR/VECM &amp; factor jobs, ad hoc reruns</td>
                <td>$5–10</td>
              </tr>
              <tr>
                <td>DB layer</td>
                <td>
                  Tiny Postgres (RDS t4g.micro or small EC2) for metadata, configs,
                  dashboards
                </td>
                <td>$10–15</td>
              </tr>
              <tr>
                <td>CloudWatch</td>
                <td>Logs &amp; metrics for ETL and APIs</td>
                <td>$1–5</td>
              </tr>
              <tr>
                <td>Front-end hosting</td>
                <td>CloudFront/Amplify for Next.js dashboard, low traffic</td>
                <td>$3–5</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  <strong>Target total</strong>
                </td>
                <td>
                  <strong>≈ $30–40</strong>
                </td>
              </tr>
            </tfoot>
          </table>
          <ul className="list" style={{ marginTop: "10px" }}>
            <li>
              <strong>Hard cap:</strong> keep infra spend under ~AUD $50/month by
              tuning S3 lifecycle, log retention, and instance sizes.
            </li>
            <li>
              <strong>No paid market data:</strong> all curve, intraday and news
              signals in the early phase rely on synthetic forwards and free sources.
            </li>
            <li>
              <strong>Upgrade path:</strong> if real-money trading ever becomes
              relevant, add paid forward curves or real-time feeds as separate
              line-items (outside this budget).
            </li>
          </ul>
        </Card>

        {/* 13. KPIs & navigation */}
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
              value="> 1.0"
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
              Commodities<span aria-hidden> ↗</span>
            </Link>
            <Link className="pill" href="/models">
              Models<span aria-hidden> ↗</span>
            </Link>
            <Link className="pill" href="/strategies">
              Strategies<span aria-hidden> ↗</span>
            </Link>
            <Link className="pill" href="/notes">
              Notes<span aria-hidden> ↗</span>
            </Link>
            <Link className="pill" href="/future">
              Future Plan<span aria-hidden> ↗</span>
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
        .bolt {
          font-size: 1.2rem;
          line-height: 1;
          display: block;
        }
        .titleBlock h1 {
          margin: 0;
        }
        .sectionLabel {
          font-family: var(--font-heading), var(--font-sans), system-ui, -apple-system, "Segoe UI", sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin: 0 0 0.75rem;
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
        }
        .cardHeader {
          display: flex; align-items: baseline; gap: 10px;
          margin: 0 0 8px 0;
        }
        .cardTitle { margin: 0; }
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
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0;
          border-radius: 0;
          background: transparent;
          color: var(--text-secondary);
          text-decoration: none;
          border: none;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .foot { 
          display:flex; gap:8px; align-items:center; justify-content:flex-end; 
          padding-top: 18px; border-top: var(--hairline) solid var(--rule); color: var(--muted);
          font-size: 12px;
        }
        .footSymbol { font-size: 14px; }

        .budget {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 13px;
        }
        .budget th,
        .budget td {
          border: 1px solid var(--rule);
          padding: 6px 8px;
          text-align: left;
          vertical-align: top;
        }
        .budget thead {
          background: color-mix(in oklab, CanvasText 4%, Canvas 96%);
        }
        .budget tfoot td {
          font-weight: 600;
        }

        /* Responsive spans */
        @media (min-width: 720px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
          .kpi { grid-column: span 1; }
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
