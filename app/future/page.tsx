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
} from "lucide-react";

/**
 * Future Plan — 18-year master plan (2025–2043)
 * Plain React + Tailwind only. High-contrast, accessible styles (light & dark).
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

type PhaseHighlight = {
    title: string;
    years: string;
    summary: string[];
    outcome: string;
    icon: ReactNode;
};

const phaseHighlights: PhaseHighlight[] = [
    {
        title: "Phase 1 — Skill Expansion & Project Launch",
        years: "2025–2026",
        summary: [
            "Complete Master of Finance (in progress) & CFA Level I.",
            "Build Econometric Energy Forecasting Dashboard; earn Python, R, Stata certs.",
            "Begin German & Norwegian; keep triathlon routine.",
        ],
        outcome: "Data-driven finance foundation with public project portfolio.",
        icon: <ChartLine className="h-5 w-5" />,
    },
    {
        title: "Phase 2 — MSc ENE @ NHH",
        years: "2027–2029",
        summary: [
            "Specialise in energy economics & geopolitics; secure an industry internship.",
            "Advance both languages to working proficiency; evolve dashboard into research.",
        ],
        outcome: "MSc with distinction, dual language capability, applied thesis.",
        icon: <BookOpen className="h-5 w-5" />,
    },
    {
        title: "Phase 3 — Early Career & CFA Completion",
        years: "2029–2032",
        summary: [
            "Enter European energy/ESG sector; earn CFA Charter + ESG Certificate.",
            "Publish applied market/policy analyses; maintain dashboard automation.",
        ],
        outcome: "Recognised as a technically literate strategist linking finance & sustainability.",
        icon: <Briefcase className="h-5 w-5" />,
    },
    {
        title: "Phase 4 — PhD in Energy Economics",
        years: "2032–2036",
        summary: [
            "Industrial PhD on energy security & market integration.",
            "Integrate prior projects as research/teaching tools; publish & present.",
        ],
        outcome: "PhD + CFA = unique hybrid of practitioner and researcher.",
        icon: <Target className="h-5 w-5" />,
    },
    {
        title: "Phase 5 — Senior Strategy Leadership",
        years: "2036–2040",
        summary: [
            "Senior economist/strategy roles in major energy/ESG orgs.",
            "Lead data-driven initiatives; maintain bilingual fluency and balanced lifestyle.",
        ],
        outcome: "High-impact leadership, shaping energy transition strategy.",
        icon: <Layers className="h-5 w-5" />,
    },
    {
        title: "Phase 6 — Executive & Thought Leadership",
        years: "2040–2043",
        summary: [
            "Executive or policy advisory roles; mentor emerging professionals.",
            "Consider Oxford/INSEAD executive energy-transition program.",
        ],
        outcome: "International thought leader with financial independence and personal balance.",
        icon: <Sparkles className="h-5 w-5" />,
    },
];

const capabilityBullets = [
    "Finance: CFA I–III + ESG Certificate (2026–31)",
    "Technical: Python, R, Stata certifications (2025)",
    "Languages: German B2, Norwegian B2/C1 (2025–29)",
    "Research: Peer-reviewed publications in Energy Economics, Applied Energy (2033–36)",
];

const lifestyleSummary =
    "Consistent endurance-sport training (6–10 h/week) evolves from local triathlons to Ironman 70.3 — anchoring discipline, resilience, and balance throughout the career.";

const by40 = [
    "PhD in Energy Economics + CFA Charterholder",
    "Fluent in English, Norwegian (B2/C1), German (B2)",
    "Proven record of quantitative modeling, publications, and leadership",
    "Senior role in energy strategy, ESG finance, or policy",
    "Financially independent, active, and balanced life",
];

const closingEssence =
    "This master plan is a structured, multi-phase blueprint to cultivate deep expertise, cross-disciplinary credibility, and sustainable personal performance — turning an 18-year trajectory into a coherent path toward global energy-strategy leadership.";

/* --------------------------------- PAGE UI -------------------------------- */

export default function FuturePlanPage() {
    return (
        <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-8 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <header className="flex flex-wrap items-center gap-3">
                <Compass className="h-7 w-7 text-slate-900 dark:text-slate-100" />
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Future Plan</h1>
                <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white dark:bg-indigo-500">
                    <span role="img" aria-label="crystal ball">
                        🔮
                    </span>
                    2025 → 2043
                </span>
            </header>

            {/* In-page nav (sticky, high-contrast) */}
            <nav
                aria-label="Section navigation"
                className="sticky top-2 z-10 -mx-2 overflow-x-auto rounded-xl border border-slate-300 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-900/90"
            >
                <ul className="flex gap-2 text-sm">
                    {[
                        ["overview", "Overview"],
                        ["identity", "Core Vision"],
                        ["phases", "Phase Highlights"],
                        ["capability", "Capabilities"],
                        ["lifestyle", "Lifestyle"],
                        ["outcomes", "By 40"],
                        ["essence", "Essence"],
                    ].map(([id, label]) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                className="inline-block rounded-lg border border-slate-300 px-3 py-1 font-medium text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                            >
                                {label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Top summary */}
            <Section id="overview" title="Overview of 18-Year Career Master Plan">
                <p className="text-slate-700 dark:text-slate-300">{topSummary}</p>
            </Section>

            {/* Identity + table */}
            <Section id="identity" title="Core Identity & Vision" icon={<Globe2 className="h-5 w-5" />}>
                <p className="mb-4">{identitySummary}</p>
                <KVGrid rows={overviewRows} />
            </Section>

            {/* Phase highlights */}
            <Section id="phases" title="Phase Highlights" icon={<Layers className="h-5 w-5" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {phaseHighlights.map((p) => (
                        <article
                            key={p.title}
                            className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900"
                        >
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                {p.icon}
                                <h3 className="font-semibold leading-snug text-slate-900 dark:text-slate-100">{p.title}</h3>
                            </div>
                            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{p.years}</p>
                            <ul className="mt-3 list-disc pl-5 text-sm space-y-1">
                                {p.summary.map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                            <div className="mt-3 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white dark:bg-indigo-500">
                                Outcome: {p.outcome}
                            </div>
                        </article>
                    ))}
                </div>
            </Section>

            {/* Capability development */}
            <Section id="capability" title="Integrated Credential & Capability Development" icon={<BookOpen className="h-5 w-5" />}>
                <BulletCards items={capabilityBullets} />
            </Section>

            {/* Lifestyle */}
            <Section id="lifestyle" title="Lifestyle Integration" icon={<HeartPulse className="h-5 w-5" />}>
                <p className="text-slate-700 dark:text-slate-300">{lifestyleSummary}</p>
                <div className="mt-3 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900">
                    <ProgressBar label="Consistency" value={85} />
                    <ProgressBar label="Resilience" value={80} />
                    <ProgressBar label="Balance" value={78} />
                </div>
            </Section>

            {/* By 40 */}
            <Section id="outcomes" title="By Age 40 (2043)" icon={<Target className="h-5 w-5" />}>
                <ul className="list-disc pl-6 space-y-1">
                    {by40.map((x) => (
                        <li key={x}>{x}</li>
                    ))}
                </ul>
            </Section>

            {/* Essence */}
            <Section id="essence" title="In Essence" icon={<Sparkles className="h-5 w-5" />}>
                <blockquote className="rounded-2xl border border-slate-300 bg-white p-4 text-sm leading-relaxed shadow-sm dark:border-slate-600 dark:bg-slate-900">
                    {closingEssence}
                </blockquote>
            </Section>

            {/* Footer */}
            <footer className="text-xs text-slate-700 dark:text-slate-300">
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
            <div className="mb-3 flex items-center gap-2">
                <span className="text-indigo-700 dark:text-indigo-400">{icon ?? <Compass className="h-5 w-5" />}</span>
                <h2 className="text-2xl font-semibold">{title}</h2>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900">
                {children}
            </div>
        </section>
    );
}

function KVGrid({ rows }: { rows: Array<[string, string]> }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map(([k, v]) => (
                <div
                    key={k}
                    className="rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-900"
                >
                    <p className="text-xs uppercase tracking-wide text-slate-700 dark:text-slate-300">{k}</p>
                    <p className="font-medium">{v}</p>
                </div>
            ))}
        </div>
    );
}

function BulletCards({ items }: { items: string[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((t) => (
                <div
                    key={t}
                    className="rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-900"
                >
                    <div className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white dark:bg-indigo-500">
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
    return (
        <div className="mb-3 last:mb-0">
            <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="tabular-nums">{value}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-300 dark:bg-slate-700">
                <div
                    className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-[width]"
                    style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                    aria-hidden
                />
            </div>
        </div>
    );
}