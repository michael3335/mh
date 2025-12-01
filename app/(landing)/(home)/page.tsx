"use client";

import Link from "next/link";
import UserStatus from "@/components/UserStatus";
import ContactLink from "@shared/components/ContactLink";

export default function HomePage() {
    return (
        <main className="landing-shell">
            <UserStatus />

            <header className="landing-header">
                <div className="landing-title-block">
                    <p className="section-label">Michael Harrison</p>
                    <h1 className="landing-heading">
                        Energy, software, and long-horizon decision-making.
                    </h1>
                    <p className="landing-lede">
                        Building a globally oriented career at the intersection of energy economics,
                        sustainability strategy, and finance — with a strong emphasis on clear,
                        durable tools rather than shiny interfaces.
                    </p>
                </div>
            </header>

            <section className="landing-section">
                <p className="section-label">About</p>
                <p>
                    I design and build research tools that sit close to real decisions — forecast
                    dashboards, strategy workspaces, and data backbones that stay readable years
                    from now. Most of the work here is deliberately simple: small typography, quiet
                    hierarchies, and a focus on the underlying models and arguments rather than the
                    UI itself.
                </p>
            </section>

            <section className="landing-section">
                <p className="section-label">Selected work</p>
                <ul className="landing-grid">
                    <li className="landing-item">
                        <Link href="/energy" className="landing-link">
                            <span className="landing-item-title">Energy hub</span>
                            <span className="landing-item-meta">
                                Data backbone, strategy complexes, and transition hypotheses.
                            </span>
                        </Link>
                    </li>
                    <li className="landing-item">
                        <Link href="/future" className="landing-link">
                            <span className="landing-item-title">18-year plan</span>
                            <span className="landing-item-meta">
                                2025–2043 roadmap across study, work, languages, and sport.
                            </span>
                        </Link>
                    </li>
                    <li className="landing-item">
                        <Link href="/insights" className="landing-link">
                            <span className="landing-item-title">Insights</span>
                            <span className="landing-item-meta">
                                Essays, notes, and case studies used to test ideas in public.
                            </span>
                        </Link>
                    </li>
                    <li className="landing-item">
                        <Link href="/models" className="landing-link">
                            <span className="landing-item-title">Model lab</span>
                            <span className="landing-item-meta">
                                Prototyping space for power, carbon, and macro models.
                            </span>
                        </Link>
                    </li>
                    <li className="landing-item">
                        <Link href="/commodities" className="landing-link">
                            <span className="landing-item-title">Commodities</span>
                            <span className="landing-item-meta">
                                Research around metals, fuels, and transition supply chains.
                            </span>
                        </Link>
                    </li>
                    <li className="landing-item">
                        <Link href="/notes" className="landing-link">
                            <span className="landing-item-title">Notes</span>
                            <span className="landing-item-meta">
                                Low-friction scratchpad for working ideas and references.
                            </span>
                        </Link>
                    </li>
                </ul>
            </section>

            <section className="landing-section">
                <p className="section-label">Skills & focus</p>
                <ul className="landing-list">
                    <li>
                        <span className="landing-list-label">Energy & markets</span>
                        <span className="landing-list-meta">
                            Power, gas, carbon, and transition economics, with a pragmatic trading
                            and policy lens.
                        </span>
                    </li>
                    <li>
                        <span className="landing-list-label">Quant & tooling</span>
                        <span className="landing-list-meta">
                            Python, R, statistics/econometrics, and data engineering for clean,
                            reusable research pipelines.
                        </span>
                    </li>
                    <li>
                        <span className="landing-list-label">Product & writing</span>
                        <span className="landing-list-meta">
                            Translating models into interfaces, docs, and narratives that decision-makers can use.
                        </span>
                    </li>
                </ul>
            </section>

            <section className="landing-section">
                <p className="section-label">Contact</p>
                <p className="landing-contact">
                    Based in Sydney, working with a European and global orientation. For access,
                    collaboration, or references, please{" "}
                    <ContactLink />.
                </p>
            </section>

            <style>{styles}</style>
        </main>
    );
}

const styles = `
.landing-shell {
  min-height: 100svh;
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 20px 72px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

@media (min-width: 900px) {
  .landing-shell {
    padding-top: 56px;
    padding-bottom: 96px;
    gap: 56px;
  }
}

.landing-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 900px) {
  .landing-header {
    gap: 20px;
  }
}

.landing-title-block {
  max-width: 46rem;
}

.section-label {
  font-family: var(--font-heading), var(--font-sans), system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

.landing-heading {
  margin: 0 0 0.5rem;
}

.landing-lede {
  margin: 0;
  color: var(--text-secondary);
}

.landing-section {
  border-top: var(--hairline) solid var(--rule);
  padding-top: 1.5rem;
}

.landing-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
}

@media (min-width: 800px) {
  .landing-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.landing-item {
  margin: 0;
}

.landing-link {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
}

.landing-item-title {
  font-family: var(--font-heading), var(--font-sans), system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 0.9rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.landing-item-meta {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.landing-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.landing-list-label {
  font-family: var(--font-heading), var(--font-sans), system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  display: block;
}

.landing-list-meta {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.landing-contact {
  margin: 0;
  color: var(--text-secondary);
}
`;
