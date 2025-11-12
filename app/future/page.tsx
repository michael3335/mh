// app/future/page.tsx
import type { ReactNode } from "react";
import { Compass } from "lucide-react"; // optional; remove if you don't use lucide

export const metadata = {
    title: "Future Plan",
    description: "18-year master plan (2025–2043)",
};

type Bullet = string | { title: string; items?: string[] };
type Section = { icon?: ReactNode; heading: string; bullets: Bullet[] };
type Phase = {
    title: string;
    years: string;
    location: string;
    age: string;
    sections: Section[];
    outcome?: string[] | string;
    salary?: string;
    lifestyle?: string;
    languages?: string;
};

const overview = [
    ["Identity", "Energy-economics & sustainability strategist with finance + data expertise"],
    ["Education", "Master of Finance → CFA I–III → MSc ENE @ NHH → PhD (Energy Econ)"],
    ["Technical", "Python · R · Stata certified + Forecasting Dashboard"],
    ["Languages", "German (B2) · Norwegian (B2/C1)"],
    ["Career arc", "Student → Analyst → Strategist → Executive / Policy Advisor"],
    ["Lifestyle", "Structured endurance-sport routine + family + balance"],
    ["Vision by 40", "Senior energy/ESG strategy or policy leader with global profile and financial independence"],
];

const phases: Phase[] = [
    {
        title: "Phase 1 — Skill Expansion & Project Launch",
        years: "2025–2026",
        location: "Australia",
        age: "22–24",
        sections: [
            {
                heading: "Academics & Qualifications",
                bullets: [
                    "Continue Master of Finance (finish 2026).",
                    "CFA Level I (mid-2026) and begin Level II (early 2027) prep.",
                    {
                        title: "Complete Python, R, and Stata short certificates:",
                        items: ["IBM Python for Data Science (Coursera)", "Data Analyst with R (DataCamp)", "LSE Data Analysis Using Stata"],
                    },
                ],
            },
            {
                heading: "Major project",
                bullets: [
                    "Build the Econometric Geopolitical Energy Forecast System / Dashboard.",
                    "Collect open datasets (Nord Pool, ENTSO-E, EIA, GPR, weather).",
                    "Implement VAR/SVAR models + web dashboard (FastAPI + React).",
                    "Document project publicly on GitHub & LinkedIn.",
                    "Publish 1–2 blog posts or a short working paper explaining model methodology.",
                ],
            },
            {
                heading: "Languages",
                bullets: ["Start German A1–A2 with Goethe-Institut.", "Begin Norwegian A1 (Folkeuniversitetet/FutureLearn)."],
            },
            { heading: "Lifestyle", bullets: ["6–8 h/wk cycling/running training.", "Compete in a sprint triathlon or Gran Fondo."] },
        ],
        outcome: [
            "Master of Finance nearly complete",
            "CFA Level I passed",
            "Working prototype dashboard (public portfolio)",
            "Formal Python/R/Stata certifications",
            "German A2 + Norwegian A1",
        ],
    },
    {
        title: "Phase 2 — MSc ENE @ NHH",
        years: "2027–2029",
        location: "Bergen, Norway",
        age: "24–26",
        sections: [
            {
                heading: "Goals",
                bullets: [
                    "MSc in Energy, Natural Resources & Environment (energy economics, sustainability, geopolitics).",
                    "Internship @ Equinor, Statkraft, or DNV (data/strategy).",
                    "Thesis expands the dashboard into academic econometric research.",
                ],
            },
            { heading: "Languages", bullets: ["German B1 (Goethe)", "Norwegian B1–B2 (NHH Norsk)."] },
            { heading: "Lifestyle", bullets: ["8–10 h/wk with BSI Cycling & Athletics.", "Race local tris / Bergen Marathon."] },
        ],
        outcome: ["MSc distinction + industry contact", "Dual language capability", "Portfolio project recognised as applied research"],
    },
    {
        title: "Phase 3 — Early Corporate Career + CFA Level III",
        years: "2029–2032",
        location: "Norway / Netherlands / Germany",
        age: "26–29",
        sections: [
            {
                heading: "Career",
                bullets: [
                    "Energy / ESG Analyst → Associate → Strategist (Statkraft, DNV, Ørsted, or finance).",
                    "Apply CFA skills to ESG/transition-finance work.",
                    "Sit CFA Level III (2030) → CFA Charter (2031).",
                    "Add CFA ESG Certificate.",
                ],
            },
            { heading: "Development", bullets: ["Publish at least one professional article.", "Maintain & automate the dashboard."] },
            { heading: "Languages", bullets: ["Maintain German B2 and Norwegian B2."] },
        ],
        salary: "NOK 650–850k (≈ AUD 95–125k)",
        lifestyle: "Stable training · 8–10 h/wk",
        outcome: ["Full CFA Charterholder", "Recognised technical + strategic analyst", "Proof of forecasting/data analytics skill"],
    },
    {
        title: "Phase 4 — Applied PhD in Energy Economics",
        years: "2032–2036",
        location: "NHH / UiO / EU partner",
        age: "29–33",
        sections: [
            {
                heading: "Focus",
                bullets: [
                    "Industrial-PhD partnership (Equinor, DNV, or policy agency).",
                    "Dissertation: Energy security, geopolitics, market integration.",
                    "Integrate dashboard as a research/teaching tool.",
                    "Publish 2–3 papers (Energy Economics, Applied Energy, Sustainable Finance & Investment).",
                    "Present at IAEE and European energy conferences.",
                ],
            },
            { heading: "Lifestyle", bullets: ["Family years · 6 h/wk training."] },
        ],
        salary: "Stipend: NOK 550–650k (AUD 80–95k)",
        outcome: "PhD + CFA + real-world project portfolio = unique hybrid profile.",
    },
    {
        title: "Phase 5 — Senior Corporate / Strategy Leadership",
        years: "2036–2040",
        location: "Europe → pivot home optional",
        age: "33–37",
        sections: [
            {
                heading: "Roles",
                bullets: [
                    "Senior Energy Economist / Strategy Manager (Equinor, DNV, Ørsted).",
                    "ESG or Sustainability Strategy Lead (finance/industry).",
                    "Pivot home to Australia: AEMO, ARENA, CSIRO, major banks.",
                ],
            },
        ],
        salary: "NOK 1.2–1.6M (AUD 180–240k)",
        languages: "Norwegian B2/C1 · German B2 maintained",
        lifestyle: "6–8 h/wk training · Ironman 70.3 or Gran Fondo each year",
        outcome: "Global energy-finance strategist with economic, technical, and geopolitical expertise.",
    },
    {
        title: "Phase 6 — Executive & Thought Leadership",
        years: "2040–2043",
        location: "Europe or Australia",
        age: "37–40",
        sections: [
            {
                heading: "Goals",
                bullets: [
                    "Executive Director / Head of Strategy / Policy Advisor.",
                    "Contribute to public discourse on the energy transition.",
                    "Mentor younger professionals; guest lecture.",
                    "Consider post-PhD exec program (INSEAD / Oxford).",
                ],
            },
        ],
        outcome: ["Financial independence; work-life-family equilibrium.", "Endurance training continues as lifestyle anchor."],
    },
];

const summaryTimeline = [
    ["1", "2025–26", "Master + CFA I + Dashboard + Data/Lang Certs", "Portfolio project + German/Norwegian basics"],
    ["2", "2027–29", "MSc ENE + Internship + Lang B1–B2", "Distinction + applied thesis"],
    ["3", "2029–32", "Corporate roles + CFA III + ESG Cert", "CFA Charter + Analyst→Strategist"],
    ["4", "2032–36", "PhD Energy Econ", "Publications + industry collaboration"],
    ["5", "2036–40", "Senior Strategy / ESG Leadership", "Senior corporate role / pivot home"],
    ["6", "2040–43", "Executive / Policy Leadership", "Director-level / thought leader"],
];

const credentialMap = [
    ["Python", "IBM Python for Data Science (Coursera)", "Verified Cert", "2025"],
    ["R", "Data Analyst with R (DataCamp)", "Track Cert", "2025"],
    ["Stata", "LSE Data Analysis Using Stata", "Online Cert", "2025"],
    ["German", "Goethe-Zertifikat A1–B2", "CEFR A1→B2", "2025–29"],
    ["Norwegian", "Norskprøve A1–B2 (opt C1 Bergenstest)", "CEFR A1→C1", "2026–29"],
    ["Finance", "CFA I–III + ESG Cert", "CFA Institute", "2026–31"],
    ["PhD-level research", "IAEE / Energy Econ Publications", "Peer-reviewed", "2033–36"],
];

const lifestyleBlocks = [
    ["2025–26", "Australia", "6–8 h/wk", "Sprint Tri / Gran Fondo"],
    ["2027–29", "Bergen", "8–10 h/wk", "Bergen Marathon / Tri"],
    ["2029–32", "Europe", "8–12 h/wk", "Alps Gran Fondo / 70.3 Tri"],
    ["2032–36", "PhD", "6–8 h/wk", "Local races"],
    ["2036–43", "Europe/Australia", "6–8 h/wk", "Ironman 70.3 / Marathon"],
];

const by2043 = [
    "PhD + CFA Charterholder",
    "Fluent in English, Norwegian (B2/C1), German (B2)",
    "Proven builder (dashboard system, publications, analytics portfolio)",
    "Senior leader in energy strategy, ESG finance, or global policy",
    "Financially independent, family established, and physically active",
];

export default function FuturePlanPage() {
    return (
        <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-6">
            <header className="flex items-center gap-3">
                <Compass className="h-7 w-7" />
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Future Plan</h1>
                <span className="ml-auto rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-700">Updated 2025→2043</span>
            </header>

            {/* Overview */}
            <section className="rounded-2xl border p-4">
                <h2 className="text-2xl font-semibold mb-3">Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {overview.map(([k, v]) => (
                        <div key={k} className="rounded-xl border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
                            <p className="font-medium">{v}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Phases (details/summary accordions) */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Phases</h2>
                {phases.map((p) => (
                    <details key={p.title} className="rounded-2xl border p-4 group">
                        <summary className="cursor-pointer list-none flex flex-wrap items-center gap-2 font-semibold">
                            {p.title}
                            <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5">{p.years}</span>
                            <span className="text-xs rounded-full border px-2 py-0.5">{p.location}</span>
                            <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5">{p.age} yrs</span>
                        </summary>
                        <div className="mt-3 space-y-4">
                            {p.sections.map((s) => (
                                <div key={s.heading}>
                                    <h4 className="font-medium mb-1">{s.heading}</h4>
                                    <ul className="list-disc pl-6 space-y-1">
                                        {s.bullets.map((b, i) =>
                                            typeof b === "string" ? (
                                                <li key={i}>{b}</li>
                                            ) : (
                                                <li key={i}>
                                                    <span className="font-medium">{b.title}</span>
                                                    {b.items && (
                                                        <ul className="list-[circle] pl-5 mt-1 space-y-1">
                                                            {b.items.map((it) => <li key={it}>{it}</li>)}
                                                        </ul>
                                                    )}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            ))}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                {p.salary && (
                                    <div className="rounded-xl border p-3">
                                        <p className="text-xs uppercase text-muted-foreground">Salary</p>
                                        <p className="font-medium">{p.salary}</p>
                                    </div>
                                )}
                                {p.languages && (
                                    <div className="rounded-xl border p-3">
                                        <p className="text-xs uppercase text-muted-foreground">Languages</p>
                                        <p className="font-medium">{p.languages}</p>
                                    </div>
                                )}
                                {p.lifestyle && (
                                    <div className="rounded-xl border p-3 sm:col-span-2">
                                        <p className="text-xs uppercase text-muted-foreground">Lifestyle</p>
                                        <p className="font-medium">{p.lifestyle}</p>
                                    </div>
                                )}
                                {p.outcome && (
                                    <div className="rounded-xl border p-3 sm:col-span-2">
                                        <p className="text-xs uppercase text-muted-foreground">Outcome</p>
                                        {Array.isArray(p.outcome) ? (
                                            <ul className="list-disc pl-6 space-y-1">{p.outcome.map((o) => <li key={o}>{o}</li>)}</ul>
                                        ) : (
                                            <p className="font-medium">{p.outcome}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </details>
                ))}
            </section>

            {/* Summary Timeline */}
            <section className="rounded-2xl border p-4">
                <h2 className="text-2xl font-semibold mb-3">Summary Timeline</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left">
                                <th className="py-2 pr-3">Phase</th>
                                <th className="py-2 pr-3">Years</th>
                                <th className="py-2 pr-3">Focus</th>
                                <th className="py-2">Key Deliverables</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryTimeline.map(([phase, years, focus, dels]) => (
                                <tr key={phase} className="border-t">
                                    <td className="py-2 pr-3 font-medium">{phase}</td>
                                    <td className="py-2 pr-3">{years}</td>
                                    <td className="py-2 pr-3">{focus}</td>
                                    <td className="py-2">{dels}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Credential Map */}
            <section className="rounded-2xl border p-4">
                <h2 className="text-2xl font-semibold mb-3">Technical & Language Credential Map</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left">
                                <th className="py-2 pr-3">Area</th>
                                <th className="py-2 pr-3">Credential</th>
                                <th className="py-2 pr-3">Level / Provider</th>
                                <th className="py-2 text-right">Target Year</th>
                            </tr>
                        </thead>
                        <tbody>
                            {credentialMap.map(([area, credential, level, year]) => (
                                <tr key={area + credential} className="border-t">
                                    <td className="py-2 pr-3 font-medium">{area}</td>
                                    <td className="py-2 pr-3">{credential}</td>
                                    <td className="py-2 pr-3">{level}</td>
                                    <td className="py-2 text-right">{year}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Lifestyle */}
            <section className="rounded-2xl border p-4">
                <h2 className="text-2xl font-semibold mb-3">Athletic & Lifestyle Integration</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left">
                                <th className="py-2 pr-3">Period</th>
                                <th className="py-2 pr-3">Base</th>
                                <th className="py-2 pr-3">Focus</th>
                                <th className="py-2">Events</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lifestyleBlocks.map(([period, base, focus, events]) => (
                                <tr key={period + base} className="border-t">
                                    <td className="py-2 pr-3 font-medium">{period}</td>
                                    <td className="py-2 pr-3">{base}</td>
                                    <td className="py-2 pr-3">{focus}</td>
                                    <td className="py-2">{events}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* By 2043 */}
            <section className="rounded-2xl border p-4">
                <h2 className="text-2xl font-semibold mb-2">✅ By 2043 (~Age 40)</h2>
                <ul className="list-disc pl-6 space-y-1">
                    {by2043.map((x) => <li key={x}>{x}</li>)}
                </ul>
            </section>

            <footer className="text-xs text-muted-foreground">
                This plan is a living document. Review quarterly; update annually.
            </footer>
        </div>
    );
}