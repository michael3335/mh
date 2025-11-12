// app/future/page.tsx
import type { ReactNode } from "react";
import {
    Compass,
    Layers,
    ChartLine,
    BookOpen,
    Briefcase,
    Target,
    Sparkles,
    Link as LinkIcon,
    CalendarDays,
    ChevronDown,
} from "lucide-react";

/**
 * Future Plan — 18-year master plan (2025–2043)
 * Server component.
 * Global aesthetic: clean, bold, minimal, black on white.
 */

export const metadata = {
    title: "Future Plan",
    description: "18-year master plan (2025–2043)",
};

/* ----------------------------- OVERVIEW COPY ------------------------------ */

const overviewText =
    "Building a globally oriented career at the intersection of energy economics, sustainability strategy, and finance — underpinned by technical fluency, language capability, and a disciplined, endurance-sport lifestyle. By age 40, you aim to be a senior energy-economics / ESG strategy leader who bridges finance, data analytics, and policy to guide the global energy transition. The plan integrates academic excellence, multilingual fluency, and endurance athletics to sustain long-term performance and balance.";

const overviewRows: Array<[string, string]> = [
    ["Identity", "Energy-economics & sustainability strategist with finance + data expertise"],
    ["Education", "Master of Finance → CFA I–III → MSc ENE @ NHH → PhD (Energy Econ)"],
    ["Technical", "Python · R · Stata certified + forecasting dashboard"],
    ["Languages", "German (B2) · Norwegian (B2/C1)"],
    ["Career Arc", "Student → Analyst → Strategist → Executive / Policy Advisor"],
    ["Lifestyle", "Structured endurance-sport routine · family · balance"],
    ["Vision by 40", "Senior energy/ESG strategy or policy leader; financial independence"],
];

/* --------------------------------- LINKS ---------------------------------- */

const L = {
    IBM_PY_DS: "https://www.coursera.org/learn/python-for-data-analysis-ibm",
    DATACAMP_R: "https://www.datacamp.com/tracks/data-analyst-with-r",
    LSE_STATA:
        "https://www.lse.ac.uk/study-at-lse/Short-courses/Summer-Schools/Methods/Summer-School-courses/Data-Analysis-Using-Stata",
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
    FUTURELEARN_NO:
        "https://www.futurelearn.com/subjects/languages-cultures-courses/norwegian",
    NHH_ENE:
        "https://www.nhh.no/en/study-programmes/msc-in-economics-and-business-administration/majors/energy-natural-resources-and-the-environment/",
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
    OXFORD_SAID:
        "https://www.sbs.ox.ac.uk/programmes/executive-education/open-programmes",
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
    kpis?: string[];
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
                    "Continue Master of Finance (target completion: 2026).",
                    "Sit CFA Level I (mid-2026); begin Level II prep (early 2027).",
                    "Certificate sprint: IBM Python for Data Science, Data Analyst with R (DataCamp), LSE Stata.",
                ],
                links: [
                    { label: "IBM Python for Data Science (Coursera)", href: L.IBM_PY_DS },
                    { label: "Data Analyst with R (DataCamp)", href: L.DATACAMP_R },
                    { label: "LSE — Data Analysis Using Stata", href: L.LSE_STATA },
                    { label: "CFA Institute", href: L.CFA },
                ],
            },
            {
                heading: "💻 Major Project — Econometric Energy Forecast Dashboard",
                bullets: [
                    "Datasets: Nord Pool prices; ENTSO-E load/gen; EIA fundamentals; Geopolitical Risk Index; weather.",
                    "Models: VAR/SVAR, impulse responses, rolling OOS evaluation and MAPE/RMSE dashboards.",
                    "Stack: FastAPI backend + React front-end; CI for nightly data pulls & retraining.",
                    "Publishing: public repo + roadmap on GitHub; monthly dev logs on LinkedIn.",
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
                bullets: ["German A1→A2 (Goethe-Institut).", "Norwegian A1 (Folkeuniversitetet or FutureLearn)."],
                links: [
                    { label: "Goethe-Institut", href: L.GOETHE },
                    { label: "Folkeuniversitetet (NO)", href: L.FOLKE },
                    { label: "FutureLearn — Norwegian", href: L.FUTURELEARN_NO },
                ],
            },
        ],
        meta: [
            { label: "Focus", value: "Foundations + visible portfolio" },
            { label: "Training", value: "6–8 h/wk endurance" },
        ],
        kpis: [
            "CFA Level I: PASS",
            "Dashboard v1 live with demo dataset",
            "2 short posts or 1 working paper on methodology",
            "German A2 · Norwegian A1",
        ],
        outcomes: [
            "Master of Finance almost complete",
            "Prototype dashboard (public)",
            "Python/R/Stata certifications",
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
                heading: "🎓 Goals & Track",
                bullets: [
                    "MSc ENE focusing on energy economics, sustainability, geopolitics.",
                    "Internship: Equinor / Statkraft / DNV (data-strategy / market analytics).",
                    "Thesis extends dashboard into academic econometric research (replication package).",
                ],
                links: [
                    { label: "NHH — MSc ENE", href: L.NHH_ENE },
                    { label: "Equinor", href: L.EQUINOR },
                    { label: "Statkraft", href: L.STATKRAFT },
                    { label: "DNV", href: L.DNV },
                ],
            },
            {
                heading: "🔬 Research & Productization",
                bullets: [
                    "Exogenous shocks: weather regimes, GPR, EUA carbon prices.",
                    "Dashboard v2: scenario analysis, confidence bands, public API.",
                    "Seminar talk; submit extended abstract to IAEE student paper session.",
                ],
                links: [{ label: "IAEE", href: L.IAEE }],
            },
            {
                heading: "🌍 Language Progress",
                bullets: ["German B1; Norwegian B1→B2 (NHH Norsk)."],
                links: [
                    { label: "Goethe-Institut", href: L.GOETHE },
                    { label: "NHH — Norwegian Courses", href: L.NHH_NORSK },
                ],
            },
            {
                heading: "🏃 Activities",
                bullets: ["8–10 h/wk with BSI Cycling & Athletics.", "Local triathlons or Bergen Marathon."],
                links: [
                    { label: "BSI Sport (Bergen)", href: L.BSI },
                    { label: "Bergen Marathon", href: L.BERGEN_MARATHON },
                ],
            },
        ],
        meta: [
            { label: "Output", value: "Distinction + applied thesis" },
            { label: "Languages", value: "B1–B2 (DE/NO)" },
        ],
        kpis: [
            "Internship secured & completed",
            "Thesis submitted (code & data appendix)",
            "Dashboard v2 (scenarios + API)",
        ],
        outcomes: ["MSc with distinction", "Dual language capability", "Applied research recognition"],
    },
    {
        title: "Phase 3 — Early Corporate Career + CFA Level III",
        years: "2029–2032",
        location: "Norway / Netherlands / Germany",
        age: "26–29",
        icon: <Briefcase className="h-5 w-5" />,
        sections: [
            {
                heading: "💼 Roles & Scope",
                bullets: [
                    "Analyst → Associate → Strategist (Statkraft, DNV, Ørsted, or finance).",
                    "ESG/transition-finance: abatement curves, portfolio emissions, green bond frameworks.",
                    "Quarterly market notes leveraging dashboard insights.",
                ],
                links: [
                    { label: "Statkraft", href: L.STATKRAFT },
                    { label: "DNV", href: L.DNV },
                    { label: "Ørsted", href: L.ORSTED },
                ],
            },
            {
                heading: "🎓 Professional Credentials",
                bullets: ["Sit CFA Level III (2030) → Charter (2031).", "Add CFA ESG Certificate."],
                links: [
                    { label: "CFA Institute", href: L.CFA },
                    { label: "CFA — ESG Certificate", href: L.CFA_ESG },
                ],
            },
            {
                heading: "🛠 Platform Continuity",
                bullets: [
                    "Dashboard v3: near-real-time pipelines; alerting; scheduled forecast jobs.",
                    "Publish one professional article and present internally.",
                ],
            },
        ],
        meta: [
            { label: "Comp (guide)", value: "NOK 650–850k (≈ AUD 95–125k)" },
            { label: "Languages", value: "Maintain DE/NO at B2" },
        ],
        kpis: [
            "CFA Charterholder by 2031",
            "≥1 external publication",
            "Dashboard v3 (automated pipeline + alerts)",
        ],
        outcomes: [
            "CFA Charterholder",
            "Recognised technical + strategic analyst",
            "Operational forecasting platform",
        ],
    },
    {
        title: "Phase 4 — Applied PhD in Energy Economics",
        years: "2032–2036",
        location: "NHH / UiO / EU partner",
        age: "29–33",
        icon: <Target className="h-5 w-5" />,
        sections: [
            {
                heading: "🎓 Program & Topic",
                bullets: [
                    "Industrial-PhD partnership (Equinor, DNV, or policy agency).",
                    "Dissertation: energy security, geopolitics, market integration.",
                    "Dashboard embedded as reproducible teaching/research tool.",
                ],
                links: [{ label: "University of Oslo (UiO)", href: L.UIO }],
            },
            {
                heading: "📚 Publishing & Conferences",
                bullets: ["2–3 papers (Energy Economics / Applied Energy / SFI).", "Present at IAEE + European conferences."],
                links: [
                    { label: "Energy Economics", href: L.JOURNAL_ENERGY_ECON },
                    { label: "Applied Energy", href: L.JOURNAL_APPLIED_ENERGY },
                    { label: "Sustainable Finance & Investment", href: L.JOURNAL_SFI },
                    { label: "IAEE", href: L.IAEE },
                ],
            },
        ],
        meta: [
            { label: "Stipend (guide)", value: "NOK 550–650k (AUD 80–95k)" },
            { label: "Mode", value: "Industrial partnership" },
        ],
        kpis: ["PhD proposal ✓ (Y1) · defense (Y4)", "≥2 peer-reviewed publications", "Teaching/demo package"],
        outcomes: "PhD + CFA + production-grade portfolio = practitioner-researcher profile.",
    },
    {
        title: "Phase 5 — Senior Corporate / Strategy Leadership",
        years: "2036–2040",
        location: "Europe → optional pivot home",
        age: "33–37",
        icon: <Layers className="h-5 w-5" />,
        sections: [
            {
                heading: "🏢 Roles",
                bullets: [
                    "Senior Energy Economist / Strategy Manager (Equinor, DNV, Ørsted).",
                    "ESG/Sustainability Strategy Lead (finance/industry).",
                    "Option to pivot to AU: AEMO, ARENA, CSIRO, major banks.",
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
            {
                heading: "📈 Impact",
                bullets: [
                    "Own multi-year transition workstreams; quantify decarbonization options.",
                    "Mentor analysts; run internal methods guild on forecasting/policy modeling.",
                ],
            },
        ],
        meta: [
            { label: "Comp (guide)", value: "NOK 1.2–1.6M (AUD 180–240k)" },
            { label: "Languages", value: "Norwegian B2/C1 · German B2" },
        ],
        kpis: ["Lead 2+ strategy initiatives", "Manager/Lead title", "External speaking slots"],
        outcomes: "High-impact strategy leader shaping energy transition direction.",
    },
    {
        title: "Phase 6 — Executive & Thought Leadership",
        years: "2040–2043",
        location: "Europe or Australia",
        age: "37–40",
        icon: <Sparkles className="h-5 w-5" />,
        sections: [
            {
                heading: "🎯 Executive Goals",
                bullets: [
                    "Executive Director / Head of Strategy / Policy Advisor.",
                    "Public discourse + mentorship cadence.",
                    "Optional: Exec energy-transition program (Oxford/INSEAD).",
                ],
                links: [
                    { label: "INSEAD — Energy Transition (Exec Ed)", href: L.INSEAD_ENERGY },
                    { label: "Oxford Saïd — Executive Education", href: L.OXFORD_SAID },
                ],
            },
        ],
        meta: [{ label: "Mode", value: "Executive influence & public voice" }],
        kpis: ["Executive/policy appointment", "Regular thought-leadership", "Active mentorship network"],
        outcomes: "Internationally visible strategy/policy leader with durable impact.",
    },
];

/* -------------------------------- TIMELINE --------------------------------- */

type TimelineItem = {
    years: string;
    phase: string;
    focus: string;
    deliverables: string;
};

const timeline: TimelineItem[] = [
    { years: "2025–26", phase: "Phase 1", focus: "Master + CFA I + Dashboard + Data/Lang Certs", deliverables: "Portfolio + DE/NO basics" },
    { years: "2027–29", phase: "Phase 2", focus: "MSc ENE + Internship + Lang B1–B2", deliverables: "Distinction + applied thesis" },
    { years: "2029–32", phase: "Phase 3", focus: "Corporate roles + CFA III + ESG Cert", deliverables: "CFA Charter + Analyst→Strategist" },
    { years: "2032–36", phase: "Phase 4", focus: "PhD Energy Econ", deliverables: "Publications + industry collab" },
    { years: "2036–40", phase: "Phase 5", focus: "Senior Strategy / ESG Leadership", deliverables: "Senior role / pivot home" },
    { years: "2040–43", phase: "Phase 6", focus: "Executive / Policy Leadership", deliverables: "Director-level / thought leader" },
];

/* --------------------------------- PAGE UI -------------------------------- */

export default function FuturePlanPage() {
    return (
        <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-10 bg-white text-black">
            {/* Header */}
            <header className="flex flex-wrap items-center gap-3">
                <Compass className="h-8 w-8" />
                <h1 className="text-4xl font-bold tracking-tight">Future Plan</h1>
                <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-black/20 px-3 py-1 text-sm font-semibold">
                    <span role="img" aria-label="crystal ball">🔮</span>
                    2025 → 2043
                </span>
            </header>

            {/* Overview */}
            <Section id="overview" title="Overview of 18-Year Career Master Plan" icon={<Compass className="h-5 w-5" />}>
                <p className="text-lg leading-relaxed">{overviewText}</p>
                <div className="mt-6">
                    <KVGrid rows={overviewRows} />
                </div>
            </Section>

            {/* Phases — Minimalist, airy, with toolbar & sticky meta column */}
            <section id="phases" className="scroll-mt-24">
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        <h2 className="text-2xl font-bold">Phases</h2>
                    </div>

                    {/* Toolbar: Expand/Collapse All (no client component needed) */}
                    <div className="flex items-center gap-2">
                        <button
                            data-phase-toggle="expand"
                            className="inline-flex items-center gap-2 rounded-full border border-black/20 px-3 py-1 text-sm font-medium hover:underline"
                        >
                            Expand all
                        </button>
                        <button
                            data-phase-toggle="collapse"
                            className="inline-flex items-center gap-2 rounded-full border border-black/20 px-3 py-1 text-sm font-medium hover:underline"
                        >
                            Collapse all
                        </button>
                    </div>
                </div>

                {/* Two-column layout: sticky meta rail on wide screens */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Sticky outline of phases */}
                    <aside className="lg:col-span-3 lg:sticky lg:top-20 space-y-2">
                        {phases.map((p, i) => (
                            <a
                                key={p.title}
                                href={`#phase-${i + 1}`}
                                className="block rounded-md px-2 py-1 text-sm hover:underline"
                            >
                                <span className="mr-2 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                                {p.years}
                            </a>
                        ))}
                    </aside>

                    {/* Accordions */}
                    <div className="lg:col-span-9 space-y-6">
                        {phases.map((p, idx) => (
                            <details
                                key={p.title}
                                id={`phase-${idx + 1}`}
                                className={[
                                    "group rounded-2xl border border-black/20 transition-colors",
                                    "[&[open]>summary>svg.chev]:rotate-180",
                                ].join(" ")}
                                open={idx === 0}
                            >
                                <summary className="flex items-start gap-4 px-5 py-4 cursor-pointer list-none">
                                    {/* Number + meta block */}
                                    <div className="min-w-16 text-sm">
                                        <div className="font-bold tabular-nums">{String(idx + 1).padStart(2, "0")}</div>
                                        <div className="mt-1 inline-flex items-center rounded-full border border-black/20 px-2 py-0.5 text-xs">
                                            {p.years}
                                        </div>
                                    </div>

                                    {/* Title + badges */}
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span>{p.icon}</span>
                                            <h3 className="text-xl font-bold">{p.title}</h3>
                                            <span className="inline-flex items-center rounded-full border border-black/20 px-2 py-0.5 text-xs">
                                                {p.location}
                                            </span>
                                            <span className="inline-flex items-center rounded-full border border-black/20 px-2 py-0.5 text-xs">
                                                {p.age} yrs
                                            </span>
                                        </div>
                                    </div>

                                    {/* Chevron */}
                                    <ChevronDown className="chev mt-1 h-5 w-5 shrink-0 transition-transform duration-300" aria-hidden />
                                </summary>

                                {/* Body */}
                                <div className="px-5 pb-5">
                                    {/* Meta badges row */}
                                    {p.meta?.length ? (
                                        <div className="mb-5 flex flex-wrap gap-2 border-t border-black/10 pt-4">
                                            {p.meta.map((m) => (
                                                <span
                                                    key={m.label + m.value}
                                                    className="inline-flex items-center gap-1 rounded-full border border-black/20 px-3 py-1 text-xs font-semibold"
                                                >
                                                    <span className="opacity-80">{m.label}:</span> {m.value}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}

                                    {/* Sections grid */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {p.sections.map((s) => (
                                            <article key={s.heading} className="rounded-xl border border-black/20 p-4">
                                                <h4 className="mb-3 text-base font-bold">{s.heading}</h4>
                                                {s.bullets && (
                                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                                        {s.bullets.map((b) => (
                                                            <li key={b}>{b}</li>
                                                        ))}
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

                                    {/* KPIs */}
                                    {p.kpis?.length ? (
                                        <div className="mt-6 rounded-xl border border-black/20 p-4">
                                            <h4 className="mb-2 text-base font-bold">🎯 Milestones & KPIs</h4>
                                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                                {p.kpis.map((k) => (
                                                    <li key={k}>{k}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null}

                                    {/* Outcomes */}
                                    {p.outcomes ? (
                                        <div className="mt-6 rounded-xl border-2 border-black p-4">
                                            <h4 className="mb-2 text-base font-bold">✅ Outcomes</h4>
                                            {Array.isArray(p.outcomes) ? (
                                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                                    {p.outcomes.map((o) => (
                                                        <li key={o}>{o}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm">{p.outcomes}</p>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>

                {/* Expand/Collapse All script (no "use client") */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
(function () {
  const root = document.getElementById('phases');
  if (!root) return;
  function setAll(open) {
    root.querySelectorAll('details').forEach(d => { d.open = open; });
  }
  root.querySelector('[data-phase-toggle="expand"]')?.addEventListener('click', () => setAll(true));
  root.querySelector('[data-phase-toggle="collapse"]')?.addEventListener('click', () => setAll(false));
})();`,
                    }}
                />
            </section>

            {/* Timeline */}
            <Section id="timeline" title="Timeline" icon={<CalendarDays className="h-5 w-5" />}>
                <Timeline items={timeline} />
            </Section>

            {/* Footer */}
            <footer className="text-xs">
                Review quarterly; update annually. Last updated automatically when content changes.
            </footer>
        </div>
    );
}

/* --------------------------------- PARTIALS -------------------------------- */

function Section({
    id,
    title,
    icon,
    children,
}: {
    id: string;
    title: string;
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-24">
            <div className="mb-4 flex items-center gap-2">
                <span>{icon ?? <Compass className="h-5 w-5" />}</span>
                <h2 className="text-2xl font-bold">{title}</h2>
            </div>
            <div className="rounded-2xl border border-black/20 p-5">{children}</div>
        </section>
    );
}

function KVGrid({ rows }: { rows: Array<[string, string]> }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-wider opacity-80">{k}</p>
                    <p className="mt-1 text-base font-bold leading-snug">{v}</p>
                </div>
            ))}
        </div>
    );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-1 py-0.5 hover:underline"
        >
            <LinkIcon className="h-3.5 w-3.5" />
            {children}
        </a>
    );
}

/* -------------------------------- TIMELINE UI ------------------------------ */

function Timeline({ items }: { items: TimelineItem[] }) {
    return (
        <ol className="relative ml-3 border-s-2 border-black/20">
            {items.map((t) => (
                <li key={t.phase} className="ms-6 pb-6 last:pb-0">
                    <span
                        className="absolute -start-1.5 mt-1 h-3.5 w-3.5 rounded-full border-2 border-black bg-white"
                        aria-hidden
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-black/20 px-2 py-0.5 text-xs font-semibold">
                            {t.years}
                        </span>
                        <span className="text-sm font-bold">{t.phase}</span>
                    </div>
                    <p className="mt-2 text-sm">
                        <span className="font-semibold">Focus:</span> {t.focus}
                    </p>
                    <p className="text-sm">
                        <span className="font-semibold">Key deliverables:</span> {t.deliverables}
                    </p>
                </li>
            ))}
        </ol>
    );
}