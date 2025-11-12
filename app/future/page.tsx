// app/future/page.tsx
import type { ReactNode } from "react";
import {
    Compass,
    Target,
    Layers,
    ChartLine,
    HeartPulse,
    Globe2,
    BookOpen,
    Briefcase,
    Sparkles,
    Link as LinkIcon,
} from "lucide-react";

/**
 * Future Plan — 18-year master plan (2025–2043)
 * High-contrast, system-color driven (Canvas/CanvasText/LinkText) and HC-friendly.
 * Uses <details>/<summary> accordions; no shadcn deps.
 */

export const metadata = {
    title: "Future Plan",
    description: "18-year master plan (2025–2043)",
};

/* ----------------------------- SUMMARY CONTENT ----------------------------- */

const topSummary =
    "Building a globally oriented career at the intersection of energy economics, sustainability strategy, and finance — underpinned by technical fluency, language capability, and a disciplined, endurance-sport lifestyle.";

const identitySummary =
    "By age 40, you aim to be a senior energy-economics / ESG strategy leader who bridges finance, data analytics, and policy to guide the global energy transition. The plan integrates academic excellence, multilingual fluency, and endurance athletics to sustain long-term performance and balance.";

const overviewRows: Array<[string, string]> = [
    ["Identity", "Energy-economics & sustainability strategist with finance + data expertise"],
    ["Education", "Master of Finance → CFA Charter → MSc (Energy & Environment) → PhD (Energy Econ)"],
    ["Technical", "Certified in Python, R, Stata; developer of an econometric energy forecasting dashboard"],
    ["Languages", "German (B2), Norwegian (B2/C1)"],
    ["Career Path", "Student → Analyst → Strategist → Executive / Policy Advisor"],
    ["Lifestyle", "Structured endurance training, family, and wellbeing balance"],
    ["Vision by 40", "Global energy/ESG strategy leader with financial independence"],
];

/* --------------------------------- LINKS ---------------------------------- */

const L = {
    IBM_PY_DS: "https://www.coursera.org/learn/python-for-data-analysis-ibm",
    DATACAMP_R: "https://www.datacamp.com/tracks/data-analyst-with-r",
    LSE_STATA: "https://www.lse.ac.uk/study-at-lse/Short-courses/Summer-Schools/Methods/Summer-School-courses/Data-Analysis-Using-Stata",
    NORDPOOL: "https://www.nordpoolgroup.com/",
    ENTSOE: "https://transparency.entsoe.eu/",
    EIA: "https://www.eia.gov/",
    GPR: "https://www.policyuncertainty.com/gpr.html",
    FASTAPI: "https://fastapi.tiangolo.com/",
    REACT: "https://react.dev/",
    GITHUB: "https://github.com/",
    LINKEDIN: "https://www.linkedin.com/",
    GOETHE: "https://www.goethe.de/",
    FOLKE: "https://www.folkeuniversitetet.no/",
    FUTURELEARN_NO: "https://www.futurelearn.com/subjects/languages-cultures-courses/norwegian",
    NHH_ENE: "https://www.nhh.no/en/study-programmes/msc-in-economics-and-business-administration/majors/energy-natural-resources-and-the-environment/",
    EQUINOR: "https://www.equinor.com/",
    STATKRAFT: "https://www.statkraft.com/",
    DNV: "https://www.dnv.com/",
    NHH_NORSK: "https://www.nhh.no/en/for-students/norwegian-courses/",
    BSI: "https://www.bsisport.no/",
    BERGEN_MARATHON: "https://maratonkarusellen.no/",
    ORSTED: "https://orsted.com/",
    CFA: "https://www.cfainstitute.org/",
    CFA_ESG: "https://www.cfainstitute.org/programs/esg-investing",
    UIO: "https://www.uio.no/english/",
    IAEE: "https://www.iaee.org/",
    JOURNAL_ENERGY_ECON: "https://www.journals.elsevier.com/energy-economics",
    JOURNAL_APPLIED_ENERGY: "https://www.sciencedirect.com/journal/applied-energy",
    JOURNAL_SFI: "https://www.tandfonline.com/journals/rsfi20",
    AEMO: "https://www.aemo.com.au/",
    ARENA: "https://arena.gov.au/",
    CSIRO: "https://www.csiro.au/",
    INSEAD_ENERGY: "https://www.insead.edu/executive-education/energy-transition",
    OXFORD_SAID: "https://www.sbs.ox.ac.uk/programmes/executive-education/open-programmes",
};

/* ------------------------- PHASE (ACCORDION) CONTENT ----------------------- */

type LinkItem = { label: string; href: string };
type PhaseSection = { heading: string; bullets?: string[]; links?: LinkItem[] };
type Phase = {
    title: string;
    years: string;
    location: string;
    age: string;
    icon: ReactNode;
    sections: PhaseSection[];
    meta?: { label: string; value: string }[];
    outcomes?: string[] | string;
};

const phases: Phase[] = [
    {
        title: "Phase 1 — Skill Expansion & Project Launch",
        years: "2025–2026",
        location: "Australia",
        age: "22–24",
        icon: <ChartLine className="h-5 w-5" />,
        sections: [
            {
                heading: "🎓 Academics & Qualifications",
                bullets: [
                    "Continue Master of Finance (finish 2026).",
                    "CFA Level I (mid-2026); begin Level II prep (early 2027).",
                    "Complete Python, R, and Stata certificates.",
                ],
                links: [
                    { label: "IBM Python for Data Science (Coursera)", href: L.IBM_PY_DS },
                    { label: "Data Analyst with R (DataCamp)", href: L.DATACAMP_R },
                    { label: "LSE Data Analysis Using Stata", href: L.LSE_STATA },
                    { label: "CFA Institute", href: L.CFA },
                ],
            },
            {
                heading: "💻 Major Project — Econometric Energy Forecast Dashboard",
                bullets: [
                    "Collect open datasets (Nord Pool, ENTSO-E, EIA, GPR, weather).",
                    "Implement VAR/SVAR models; ship web dashboard (FastAPI + React).",
                    "Document progress (GitHub/LinkedIn); publish 1–2 posts or a short working paper.",
                ],
                links: [
                    { label: "Nord Pool", href: L.NORDPOOL },
                    { label: "ENTSO-E Transparency", href: L.ENTSOE },
                    { label: "EIA", href: L.EIA },
                    { label: "GPR Index", href: L.GPR },
                    { label: "FastAPI", href: L.FASTAPI },
                    { label: "React", href: L.REACT },
                    { label: "GitHub", href: L.GITHUB },
                    { label: "LinkedIn", href: L.LINKEDIN },
                ],
            },
            {
                heading: "🌍 Languages",
                bullets: ["Start German A1–A2 (Goethe-Institut).", "Begin Norwegian A1 (Folkeuniversitetet or FutureLearn)."],
                links: [
                    { label: "Goethe-Institut", href: L.GOETHE },
                    { label: "Folkeuniversitetet (NO)", href: L.FOLKE },
                    { label: "FutureLearn — Norwegian", href: L.FUTURELEARN_NO },
                ],
            },
            { heading: "🏃 Lifestyle", bullets: ["6–8 h/wk training.", "Sprint triathlon or Gran Fondo."] },
        ],
        outcomes: [
            "MoF nearly complete; CFA I passed.",
            "Prototype dashboard (public).",
            "Python/R/Stata certs.",
            "German A2 + Norwegian A1.",
        ],
    },
    {
        title: "Phase 2 — MSc ENE @ NHH",
        years: "2027–2029",
        location: "Bergen, Norway",
        age: "24–26",
        icon: <BookOpen className="h-5 w-5" />,
        sections: [
            {
                heading: "🎓 Goals",
                bullets: [
                    "MSc in Energy, Natural Resources & Environment (econ, sustainability, geopolitics).",
                    "Internship at Equinor, Statkraft, or DNV (data/strategy).",
                    "Thesis evolves dashboard into academic econometric research.",
                ],
                links: [
                    { label: "NHH MSc ENE", href: L.NHH_ENE },
                    { label: "Equinor", href: L.EQUINOR },
                    { label: "Statkraft", href: L.STATKRAFT },
                    { label: "DNV", href: L.DNV },
                ],
            },
            {
                heading: "🌍 Languages",
                bullets: ["Advance to German B1, Norwegian B1–B2."],
                links: [
                    { label: "Goethe-Institut", href: L.GOETHE },
                    { label: "NHH Norwegian Courses", href: L.NHH_NORSK },
                ],
            },
            {
                heading: "🏃 Lifestyle",
                bullets: ["8–10 h/wk with BSI Cycling & Athletics.", "Local tris or Bergen Marathon."],
                links: [
                    { label: "BSI Sport (Bergen)", href: L.BSI },
                    { label: "Bergen Marathon", href: L.BERGEN_MARATHON },
                ],
            },
        ],
        outcomes: ["MSc distinction + industry contact", "Dual language capability", "Applied research thesis"],
    },
    {
        title: "Phase 3 — Early Corporate Career + CFA Level III",
        years: "2029–2032",
        location: "Norway / Netherlands / Germany",
        age: "26–29",
        icon: <Briefcase className="h-5 w-5" />,
        sections: [
            {
                heading: "💼 Career",
                bullets: [
                    "Energy/ESG Analyst → Associate → Strategist (Statkraft, DNV, Ørsted, or finance).",
                    "Apply CFA to ESG/transition finance.",
                    "Sit CFA Level III (2030) → Charter (2031) + ESG Certificate.",
                ],
                links: [
                    { label: "Statkraft", href: L.STATKRAFT },
                    { label: "DNV", href: L.DNV },
                    { label: "Ørsted", href: L.ORSTED },
                    { label: "CFA Institute", href: L.CFA },
                    { label: "CFA ESG Certificate", href: L.CFA_ESG },
                ],
            },
            {
                heading: "📈 Development",
                bullets: ["Publish a professional article.", "Automate & expand the dashboard."],
            },
            { heading: "🌍 Languages", bullets: ["Maintain German B2 and Norwegian B2."] },
        ],
        meta: [
            { label: "Salary (guide)", value: "NOK 650–850k (≈ AUD 95–125k)" },
            { label: "Lifestyle", value: "Stable training · 8–10 h/wk" },
        ],
        outcomes: ["CFA Charterholder", "Recognised technical + strategic analyst", "Proof of forecasting/analytics skill"],
    },
    {
        title: "Phase 4 — Applied PhD in Energy Economics",
        years: "2032–2036",
        location: "NHH / UiO / EU partner",
        age: "29–33",
        icon: <Target className="h-5 w-5" />,
        sections: [
            {
                heading: "🎓 Focus",
                bullets: [
                    "Industrial-PhD partnership (Equinor, DNV, or policy agency).",
                    "Dissertation: energy security, geopolitics, market integration.",
                    "Dashboard used as research/teaching tool.",
                    "Publish 2–3 papers; present at conferences.",
                ],
                links: [
                    { label: "University of Oslo (UiO)", href: L.UIO },
                    { label: "IAEE", href: L.IAEE },
                    { label: "Energy Economics (journal)", href: L.JOURNAL_ENERGY_ECON },
                    { label: "Applied Energy (journal)", href: L.JOURNAL_APPLIED_ENERGY },
                    { label: "Sustainable Finance & Investment (journal)", href: L.JOURNAL_SFI },
                ],
            },
        ],
        meta: [
            { label: "Stipend (guide)", value: "NOK 550–650k (AUD 80–95k)" },
            { label: "Lifestyle", value: "Family years · ~6 h/wk training" },
        ],
        outcomes: "PhD + CFA + real-world portfolio = unique hybrid profile.",
    },
    {
        title: "Phase 5 — Senior Corporate / Strategy Leadership",
        years: "2036–2040",
        location: "Europe → pivot home optional",
        age: "33–37",
        icon: <Layers className="h-5 w-5" />,
        sections: [
            {
                heading: "🏢 Roles",
                bullets: [
                    "Senior Energy Economist / Strategy Manager (Equinor, DNV, Ørsted).",
                    "ESG/Sustainability Strategy Lead (finance/industry).",
                    "Pivot home to Australia: AEMO, ARENA, CSIRO, major banks.",
                ],
                links: [
                    { label: "Equinor", href: L.EQUINOR },
                    { label: "DNV", href: L.DNV },
                    { label: "Ørsted", href: L.ORSTED },
                    { label: "AEMO (AU)", href: L.AEMO },
                    { label: "ARENA (AU)", href: L.ARENA },
                    { label: "CSIRO (AU)", href: L.CSIRO },
                ],
            },
        ],
        meta: [
            { label: "Salary (guide)", value: "NOK 1.2–1.6M (AUD 180–240k)" },
            { label: "Languages", value: "Norwegian B2/C1 · German B2 maintained" },
            { label: "Lifestyle", value: "6–8 h/wk; 70.3 or Gran Fondo / yr" },
        ],
        outcomes: "Global energy-finance strategist with economic, technical, and geopolitical depth.",
    },
    {
        title: "Phase 6 — Executive & Thought Leadership",
        years: "2040–2043",
        location: "Europe or Australia",
        age: "37–40",
        icon: <Sparkles className="h-5 w-5" />,
        sections: [
            {
                heading: "🎯 Goals",
                bullets: [
                    "Executive Director / Head of Strategy / Policy Advisor.",
                    "Contribute to public discourse; mentor rising professionals.",
                    "Consider executive energy-transition program for global network.",
                ],
                links: [
                    { label: "INSEAD — Energy Transition (Exec Ed)", href: L.INSEAD_ENERGY },
                    { label: "Oxford Saïd — Executive Education", href: L.OXFORD_SAID },
                ],
            },
        ],
        meta: [
            { label: "Lifestyle", value: "Endurance training as lifestyle anchor" },
            { label: "Financial", value: "Financial independence" },
        ],
        outcomes: "International thought leader with balance across work, life, and health.",
    },
];

const capabilityBullets = [
    "Finance: CFA I–III + ESG Certificate (2026–31)",
    "Technical: Python, R, Stata certifications (2025)",
    "Languages: German B2, Norwegian B2/C1 (2025–29)",
    "Research: Peer-reviewed publications in Energy Economics, Applied Energy (2033–36)",
];

const by40 = [
    "PhD in Energy Economics + CFA Charterholder",
    "Fluent in English, Norwegian (B2/C1), German (B2)",
    "Proven record of quantitative modeling, publications, and leadership",
    "Senior role in energy strategy, ESG finance, or policy",
    "Financially independent, active, and balanced life",
];

const lifestyleSummary =
    "Consistent endurance-sport training (6–10 h/week) evolves from local triathlons to Ironman 70.3 — anchoring discipline, resilience, and balance throughout the career.";

const closingEssence =
    "This master plan is a structured, multi-phase blueprint to cultivate deep expertise, cross-disciplinary credibility, and sustainable personal performance — turning an 18-year trajectory into a coherent path toward global energy-strategy leadership.";

/* --------------------------------- PAGE UI -------------------------------- */

export default function FuturePlanPage() {
    return (
        <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-8 bg-[Canvas] text-[CanvasText]">
            {/* Header */}
            <header className="flex flex-wrap items-center gap-3">
                <Compass className="h-7 w-7 text-current" />
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Future Plan</h1>
                <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-current px-3 py-1 text-sm font-semibold">
                    <span role="img" aria-label="crystal ball">🔮</span>
                    2025 → 2043
                </span>
            </header>

            {/* Sticky in-page nav */}
            <nav
                aria-label="Section navigation"
                className="sticky top-2 z-10 -mx-2 overflow-x-auto rounded-xl border border-current bg-[Canvas] p-2 shadow-sm"
            >
                <ul className="flex gap-2 text-sm">
                    {[
                        ["overview", "Overview"],
                        ["identity", "Core Vision"],
                        ["phases", "Phases"],
                        ["capability", "Capabilities"],
                        ["lifestyle", "Lifestyle"],
                        ["outcomes", "By 40"],
                        ["essence", "Essence"],
                    ].map(([id, label]) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                className="inline-block rounded-lg border border-current px-3 py-1 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[CanvasText]"
                            >
                                {label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Overview */}
            <Section id="overview" title="Overview of 18-Year Career Master Plan">
                <p className="opacity-95">{topSummary}</p>
            </Section>

            {/* Identity */}
            <Section id="identity" title="Core Identity & Vision" icon={<Globe2 className="h-5 w-5 text-current" />}>
                <p className="mb-4">{identitySummary}</p>
                <KVGrid rows={overviewRows} />
            </Section>

            {/* Phases — Accordion */}
            <Section id="phases" title="Phases (collapsible)" icon={<Layers className="h-5 w-5 text-current" />}>
                <div className="space-y-3">
                    {phases.map((p) => (
                        <details key={p.title} className="rounded-2xl border border-current shadow-sm">
                            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
                                <span className="text-current">{p.icon}</span>
                                <span className="font-semibold">{p.title}</span>
                                <span className="ml-2 rounded-full border border-current px-2 py-0.5 text-xs">{p.years}</span>
                                <span className="ml-2 hidden rounded-full px-2 py-0.5 text-xs sm:inline">{p.location}</span>
                                <span className="ml-2 rounded-full px-2 py-0.5 text-xs">{p.age} yrs</span>
                            </summary>

                            <div className="px-4 pb-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {p.sections.map((s) => (
                                        <article key={s.heading} className="rounded-xl border border-current/60 p-4 hc-border">
                                            <h4 className="mb-2 font-semibold">{s.heading}</h4>
                                            {s.bullets && (
                                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                                    {s.bullets.map((b) => <li key={b}>{b}</li>)}
                                                </ul>
                                            )}
                                            {s.links?.length ? (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {s.links.map((lnk) => (
                                                        <ExternalLink key={lnk.href} href={lnk.href}>
                                                            {lnk.label}
                                                        </ExternalLink>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </article>
                                    ))}
                                </div>

                                {p.meta?.length ? (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {p.meta.map((m) => (
                                            <span key={m.label + m.value} className="rounded-full border border-current px-3 py-1 text-xs font-semibold">
                                                {m.label}: {m.value}
                                            </span>
                                        ))}
                                    </div>
                                ) : null}

                                {p.outcomes ? (
                                    <div className="mt-4 rounded-xl border-2 border-current px-4 py-3 text-sm font-semibold">
                                        {Array.isArray(p.outcomes) ? (
                                            <ul className="list-disc pl-5">{p.outcomes.map((o) => <li key={o}>{o}</li>)}</ul>
                                        ) : (
                                            <span>Outcome: {p.outcomes}</span>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </details>
                    ))}
                </div>
            </Section>

            {/* Capability development */}
            <Section id="capability" title="Integrated Credential & Capability Development" icon={<BookOpen className="h-5 w-5 text-current" />}>
                <BulletCards items={capabilityBullets} />
            </Section>

            {/* Lifestyle */}
            <Section id="lifestyle" title="Lifestyle Integration" icon={<HeartPulse className="h-5 w-5 text-current" />}>
                <p className="opacity-95">{lifestyleSummary}</p>
                <div className="mt-3 rounded-2xl border border-current p-4 shadow-sm">
                    <ProgressBar label="Consistency" value={85} />
                    <ProgressBar label="Resilience" value={80} />
                    <ProgressBar label="Balance" value={78} />
                </div>
            </Section>

            {/* By 40 */}
            <Section id="outcomes" title="By Age 40 (2043)" icon={<Target className="h-5 w-5 text-current" />}>
                <ul className="list-disc pl-6 space-y-1">
                    {by40.map((x) => <li key={x}>{x}</li>)}
                </ul>
            </Section>

            {/* Essence */}
            <Section id="essence" title="In Essence" icon={<Sparkles className="h-5 w-5 text-current" />}>
                <blockquote className="rounded-2xl border-2 border-current p-4 text-sm leading-relaxed">
                    {closingEssence}
                </blockquote>
            </Section>

            {/* HC helpers */}
            <style jsx>{`
        @media (forced-colors: active) {
          .hc-border { border-color: CanvasText !important; }
        }
      `}</style>

            {/* Footer */}
            <footer className="text-xs opacity-90">
                Review quarterly; update annually. Last updated automatically when content changes.
            </footer>
        </div>
    );
}

/* --------------------------------- PARTIALS -------------------------------- */

function Section({ id, title, icon, children }: { id: string; title: string; icon?: ReactNode; children: ReactNode }) {
    return (
        <section id={id} className="scroll-mt-24">
            <div className="mb-3 flex items-center gap-2">
                <span className="text-current">{icon ?? <Compass className="h-5 w-5 text-current" />}</span>
                <h2 className="text-2xl font-semibold">{title}</h2>
            </div>
            <div className="rounded-2xl border border-current p-4 shadow-sm">{children}</div>
        </section>
    );
}

function KVGrid({ rows }: { rows: Array<[string, string]> }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-current p-3">
                    <p className="text-xs uppercase tracking-wide opacity-90">{k}</p>
                    <p className="font-semibold">{v}</p>
                </div>
            ))}
        </div>
    );
}

function BulletCards({ items }: { items: string[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((t) => (
                <div key={t} className="rounded-xl border border-current p-3">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs font-bold">
                            •
                        </span>
                        <p className="text-sm">{t}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
    const clamped = Math.max(0, Math.min(100, value));
    return (
        <div className="mb-3 last:mb-0">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold">
                <span>{label}</span>
                <span className="tabular-nums">{clamped}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full border border-current">
                <div className="h-full bg-current" style={{ width: `${clamped}%` }} aria-hidden />
            </div>
        </div>
    );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-current px-2 py-1 text-[LinkText] underline decoration-current underline-offset-2"
        >
            <LinkIcon className="h-3.5 w-3.5" />
            {children}
        </a>
    );
}