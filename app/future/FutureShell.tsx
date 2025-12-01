"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
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
 * Client component:
 * - Uses GSAP for subtle load-in animation
 * - Typography + spacing consistent with michaelharrison.au
 * - Quiet, print-like layout similar to kweishunyu.com / matthewporteous.com
 */

/* ----------------------------- OVERVIEW COPY ------------------------------ */

const overviewText =
    "Building a globally oriented career at the intersection of energy economics, sustainability strategy, and finance. The core tools are an econometric energy-forecast dashboard, strong technical fluency, multilingual capability, and a disciplined endurance-sport routine. By age 40, the goal is to be a senior energy or ESG strategy/policy leader with a global profile, bridging finance, data and policy to guide the energy transition. The plan emphasises focused execution, clear option value at each transition, and long-term performance through academic excellence, professional credentials, languages and endurance athletics.";

const overviewRows: readonly [string, string][] = [
    [
        "Identity",
        "Energy-economics & sustainability strategist with finance + data expertise",
    ],
    [
        "Education",
        "Master of Finance → CFA I–III → European MSc (energy/ESG) → Applied PhD (Energy Econ, preferred but optional)",
    ],
    [
        "Technical",
        "Python · R · Stata certified + Econometric Energy Forecast Dashboard (flagship platform)",
    ],
    ["Languages", "German (B2) · Norwegian (B2/C1)"],
    [
        "Career Arc",
        "Student → Analyst → Strategist → Senior Leader / Policy Advisor",
    ],
    ["Lifestyle", "Structured endurance-sport routine · family · balance"],
    [
        "Vision by 40",
        "Senior energy/ESG strategy or policy leader with global profile and financial independence",
    ],
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
    INSEAD_ENERGY:
        "https://www.insead.edu/executive-education/energy-transition",
    OXFORD_SAID:
        "https://www.sbs.ox.ac.uk/programmes/executive-education/open-programmes",

    // Graduate programmes (more detailed)
    COLOGNE_EWI: "https://www.ewi.uni-koeln.de/en/",
    COLOGNE_MSC_ECON_RESEARCH:
        "https://wiso.uni-koeln.de/en/studies/application/master/master-economic-research",
    COPENHAGEN_ECON: "https://www.ku.dk/studies/masters/economics/",
    COPENHAGEN_ENV_ECON:
        "https://science.ku.dk/english/study-at-science/masters-programmes/environment-and-development/",
    UIO_ECON_MSC:
        "https://www.uio.no/english/studies/programmes/economics-master/",
    AALTO_ADVANCED_ENERGY:
        "https://www.aalto.fi/en/study-options/masters-programme-in-advanced-energy-solutions",
    LUND_SUSTAINABLE_ENERGY:
        "https://www.lunduniversity.lu.se/lubas/i-uoh-lu-TAREE",
} as const;

/* ------------------------- PHASE (ACCORDION) CONTENT ----------------------- */

type LinkItem = { label: string; href: keyof typeof L };
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

const phases: readonly Phase[] = [
    {
        title: "Phase 1 — Foundations & Flagship Project Launch",
        years: "2025–2026",
        location: "Australia",
        age: "22–24",
        icon: <ChartLine className="h-5 w-5" />,
        sections: [
            {
                heading: "🎓 Academics & Credentials",
                bullets: [
                    "Complete the Master of Finance by Dec 2026 with strong results in econometrics, derivatives and core finance.",
                    "Sit CFA Level I in mid-2026 with structured prep from late 2025.",
                    "Finish Python, R and Stata certificates by end-2026 (with flexibility to push one into early 2027 if workload demands).",
                ],
                links: [
                    { label: "IBM Python for Data Science (Coursera)", href: "IBM_PY_DS" },
                    { label: "Data Analyst with R (DataCamp)", href: "DATACAMP_R" },
                    { label: "LSE — Data Analysis Using Stata", href: "LSE_STATA" },
                    { label: "CFA Institute", href: "CFA" },
                ],
            },
            {
                heading: "💻 Flagship Dashboard — V1",
                bullets: [
                    "2025: Build clean data pipelines for key Nord Pool / ENTSO-E series and simple baseline models (e.g. ARIMA or small VAR) for day-ahead prices.",
                    "2026: Extend to multi-variable models integrating fuel prices, macro indicators and geopolitical risk; add basic evaluation metrics and charts.",
                    "Expose forecasts via a simple public interface (e.g. FastAPI + minimal dashboard) and document clearly with a README and one substantive write-up.",
                ],
                links: [
                    { label: "Nord Pool", href: "NORDPOOL" },
                    { label: "ENTSO-E Transparency", href: "ENTSOE" },
                    { label: "EIA", href: "EIA" },
                    { label: "GPR Index", href: "GPR" },
                    { label: "FastAPI", href: "FASTAPI" },
                    { label: "React", href: "REACT" },
                    { label: "GitHub", href: "GITHUB" },
                    { label: "LinkedIn", href: "LINKEDIN" },
                ],
            },
            {
                heading: "🌍 Languages",
                bullets: [
                    "Reach German A2 via Goethe-Institut courses and consistent self-study.",
                    "Start Norwegian (A1) through Folkeuniversitetet or online courses, with light but regular input (NRK, simple podcasts, apps).",
                ],
                links: [
                    { label: "Goethe-Institut", href: "GOETHE" },
                    { label: "Folkeuniversitetet (NO)", href: "FOLKE" },
                    { label: "FutureLearn — Norwegian", href: "FUTURELEARN_NO" },
                ],
            },
            {
                heading: "🏃 Lifestyle",
                bullets: [
                    "Maintain a stable 6–8 h/wk training base with one endurance, one intensity and one strength session per week.",
                    "Complete at least one sprint triathlon or Gran Fondo by end-2026 as proof of consistent training, not peak performance.",
                ],
            },
        ],
        meta: [
            { label: "Focus", value: "Foundations + visible portfolio" },
            { label: "Training", value: "6–8 h/wk endurance" },
        ],
        kpis: [
            "CFA Level I: PASS",
            "Dashboard V1 live with public demo",
            "≥1 substantive write-up on dashboard methodology",
            "German A2 · Norwegian A1",
        ],
        outcomes: [
            "Master of Finance close to completion (Dec 2026)",
            "Public, working prototype dashboard (V1)",
            "Core Python/R/Stata skills validated by certificates",
        ],
    },
    {
        title: "Phase 2 — MSc ENE @ NHH (or equivalent)",
        years: "2027–2029",
        location: "Bergen, Norway",
        age: "24–26",
        icon: <BookOpen className="h-5 w-5" />,
        sections: [
            {
                heading: "🎓 Goals & Track",
                bullets: [
                    "Complete a European MSc focused on energy economics, sustainability and markets (NHH ENE or equivalent in Copenhagen, Cologne, Oslo, etc.).",
                    "Secure an energy/market analytics or data-strategy internship (Equinor, Statkraft, DNV or similar).",
                    "Use the dashboard as the backbone of an applied econometric thesis with a full replication package (code + data appendix).",
                ],
                links: [
                    { label: "NHH — MSc ENE", href: "NHH_ENE" },
                    { label: "Equinor", href: "EQUINOR" },
                    { label: "Statkraft", href: "STATKRAFT" },
                    { label: "DNV", href: "DNV" },
                ],
            },
            {
                heading: "🔬 Research & Productization",
                bullets: [
                    "Model exogenous shocks from weather regimes, geopolitical risk and carbon prices into European power and gas markets.",
                    "Advance the dashboard to V2: richer scenario analysis, confidence bands and a simple public API for selected forecasts.",
                    "Give at least one seminar talk and submit an extended abstract to an IAEE student/young professional session.",
                ],
                links: [{ label: "IAEE", href: "IAEE" }],
            },
            {
                heading: "🌍 Language Progress",
                bullets: [
                    "Advance along the language trajectory: target German B1 and Norwegian B2 by the end of the MSc window.",
                ],
                links: [
                    { label: "Goethe-Institut", href: "GOETHE" },
                    { label: "NHH — Norwegian Courses", href: "NHH_NORSK" },
                ],
            },
            {
                heading: "🏃 Activities",
                bullets: [
                    "Sustain 8–10 h/wk training through BSI clubs or equivalents, using local triathlons and the Bergen Marathon as annual anchors.",
                ],
                links: [
                    { label: "BSI Sport (Bergen)", href: "BSI" },
                    { label: "Bergen Marathon", href: "BERGEN_MARATHON" },
                ],
            },
        ],
        meta: [
            { label: "Output", value: "Distinction + applied thesis" },
            { label: "Languages", value: "Towards B1–B2 (DE/NO)" },
        ],
        kpis: [
            "Internship secured & completed",
            "Thesis submitted with code/data appendix",
            "Dashboard V2 (scenarios + API) in use",
        ],
        outcomes: [
            "MSc with distinction (target)",
            "Practical experience in European energy markets",
            "Dashboard recognised as an applied research tool",
        ],
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
                    "Progress from Energy / ESG / Market Analyst → Associate → Strategist in utilities, TSOs, consultancies or transition-focused finance roles.",
                    "Apply CFA skills to transition finance, project evaluation and portfolio decarbonisation work.",
                    "Produce regular market notes or strategy memos that leverage dashboard outputs for internal stakeholders.",
                ],
                links: [
                    { label: "Statkraft", href: "STATKRAFT" },
                    { label: "DNV", href: "DNV" },
                    { label: "Ørsted", href: "ORSTED" },
                ],
            },
            {
                heading: "🎓 Professional Credentials",
                bullets: [
                    "Complete CFA Levels II and III on schedule and obtain the CFA Charter by the early 2030s.",
                    "Add the CFA ESG Certificate around 2031–2032, aligned with day-to-day work.",
                ],
                links: [
                    { label: "CFA Institute", href: "CFA" },
                    { label: "CFA — ESG Certificate", href: "CFA_ESG" },
                ],
            },
            {
                heading: "🛠 Platform Continuity",
                bullets: [
                    "Advance the dashboard to V3: near-real-time pipelines, automated forecast jobs and alerting for key risk events.",
                    "Publish at least one external professional article and present internally on methods and lessons learned.",
                ],
            },
        ],
        meta: [
            { label: "Comp (guide)", value: "NOK 650–850k (≈ AUD 95–125k)" },
            { label: "Languages", value: "Maintain DE/NO at B2" },
        ],
        kpis: [
            "CFA Charterholder status achieved",
            "≥1 external publication",
            "Dashboard V3 embedded in workflow",
        ],
        outcomes: [
            "CFA Charterholder with ESG credential",
            "Recognised technical + strategic analyst",
            "Operational forecasting platform used in corporate decision-making",
        ],
    },
    {
        title:
            "Phase 4 — Applied PhD in Energy Economics (preferred) / Alternative Track",
        years: "2032–2036",
        location: "NHH / UiO / EU partner",
        age: "29–33",
        icon: <Target className="h-5 w-5" />,
        sections: [
            {
                heading: "🎓 Program & Topic (Preferred Path)",
                bullets: [
                    "Pursue an industrial or applied PhD partnership (Equinor, DNV, Statkraft, TSO, or policy agency).",
                    "Focus dissertation on energy security, market integration and geopolitics (e.g. shock transmission across power, gas and carbon markets).",
                    "Embed the dashboard as a reproducible research and teaching platform (labs, student projects, demos).",
                ],
                links: [{ label: "University of Oslo (UiO)", href: "UIO" }],
            },
            {
                heading: "📚 Publishing & Conferences",
                bullets: [
                    "Publish 2–3 peer-reviewed papers (Energy Economics, Applied Energy, Sustainable Finance & Investment or similar).",
                    "Present at IAEE and key European energy conferences while maintaining some practitioner-facing writing.",
                ],
                links: [
                    { label: "Energy Economics", href: "JOURNAL_ENERGY_ECON" },
                    { label: "Applied Energy", href: "JOURNAL_APPLIED_ENERGY" },
                    { label: "Sustainable Finance & Investment", href: "JOURNAL_SFI" },
                    { label: "IAEE", href: "IAEE" },
                ],
            },
            {
                heading: "🔁 Alternative Track (If PhD Is Delayed or Skipped)",
                bullets: [
                    "Continue in senior analyst/manager roles in corporate or policy settings while co-authoring papers with academics or think-tanks.",
                    "Use the dashboard as a base for industry white papers and thought-leadership pieces to build a practitioner-research profile without a formal PhD.",
                    "Target roles in regulators, central banks or international organisations that value applied modelling and policy insight over formal academic credentials.",
                ],
            },
        ],
        meta: [
            { label: "Stipend (guide)", value: "NOK 550–650k (AUD 80–95k)" },
            { label: "Mode", value: "Industrial PhD or senior practitioner track" },
        ],
        kpis: [
            "PhD proposal approved (Y1) & defence (Y4), or equivalent senior-practitioner promotion",
            "≥2 peer-reviewed or equivalent high-quality publications",
            "Dashboard leveraged as recognised research/teaching or industry tool",
        ],
        outcomes:
            "Preferred: PhD + CFA + production-grade portfolio = practitioner-researcher profile. Alternative: senior practitioner with strong publications and a recognised modelling platform.",
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
                    "Hold a Senior Energy Economist, Head of Market Analysis, Strategy Manager or similar role in major energy companies, TSOs or advisory firms.",
                    "Alternatively, serve as ESG/Sustainability Strategy Lead or Head of Transition Finance in banks, asset managers or infrastructure funds.",
                    "Preserve the option to pivot to Australia into roles at AEMO, ARENA, CSIRO, CEFC or major banks/super funds.",
                ],
                links: [
                    { label: "Equinor", href: "EQUINOR" },
                    { label: "DNV", href: "DNV" },
                    { label: "Ørsted", href: "ORSTED" },
                    { label: "AEMO (AU)", href: "AEMO" },
                    { label: "ARENA (AU)", href: "ARENA" },
                    { label: "CSIRO (AU)", href: "CSIRO" },
                ],
            },
            {
                heading: "📈 Impact & Positioning",
                bullets: [
                    "Own multi-year transition workstreams (e.g. decarbonisation roadmaps, security-of-supply strategies, grid or asset investment plans).",
                    "Lead teams of analysts and run an internal methods guild/community around forecasting, energy economics and policy modelling.",
                    "Clarify and lean into your preferred archetype: corporate strategy leader (firm-level impact) or policy/think-tank leader (system-level impact).",
                ],
            },
            {
                heading: "🏃 Lifestyle & Balance",
                bullets: [
                    "Maintain 6–8 h/wk training with one major event per year (Ironman 70.3, Gran Fondo or marathon).",
                    "Deliberately protect family and recovery time; design systems for sustainable high performance rather than constant sprinting.",
                ],
            },
        ],
        meta: [
            { label: "Comp (guide)", value: "NOK 1.2–1.6M (AUD 180–240k)" },
            { label: "Languages", value: "Norwegian B2/C1 · German B2" },
        ],
        kpis: [
            "Hold a Senior/Lead/Head title in strategy/analytics",
            "Lead 2+ major transition or strategy initiatives",
            "Regular external speaking slots (conferences, panels, media)",
        ],
        outcomes:
            "High-impact strategy leader shaping major energy transition decisions in corporate or policy settings.",
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
                    "Hold an Executive Director, Head of Strategy, Chief Economist or Senior Policy Advisor role in a major energy, financial or policy institution.",
                    "Contribute regularly to public discourse on the energy transition (op-eds, reports, podcasts, conferences).",
                    "Maintain a structured mentorship habit (1:1s, internal cohorts or guest lectures at universities).",
                ],
            },
            {
                heading: "🎓 Executive Education & Network",
                bullets: [
                    "Optionally complete an executive energy-transition or leadership program (INSEAD, Oxford or similar) to deepen network and broaden perspective.",
                ],
                links: [
                    { label: "INSEAD — Energy Transition (Exec Ed)", href: "INSEAD_ENERGY" },
                    { label: "Oxford Saïd — Executive Education", href: "OXFORD_SAID" },
                ],
            },
            {
                heading: "🏃 Lifestyle & Independence",
                bullets: [
                    "Reach financial independence or close to it so work becomes primarily impact- and interest-driven.",
                    "Keep endurance training (6–8 h/wk) as a lifestyle anchor supporting clarity, resilience and longevity.",
                ],
            },
        ],
        meta: [{ label: "Mode", value: "Executive influence & public voice" }],
        kpis: [
            "Executive or top-tier policy/thought-leadership appointment",
            "Sustained, visible contribution to energy transition discourse",
            "Active mentorship network and stable endurance routine",
        ],
        outcomes:
            "Internationally visible strategy/policy leader with durable impact, financial independence and a sustainable, family-centred lifestyle.",
    },
];

/* -------------------------------- GRAD OPTIONS ---------------------------- */

type UniOption = {
    key: string;
    name: string;
    city: string;
    country: string;
    primaryProgramme: string;
    altProgrammes?: string[];
    intake: string;
    appWindow: string;
    decisionWindow: string;
    notes: string[];
    links: LinkItem[];
};

const uniOptions: readonly UniOption[] = [
    {
        key: "nhh",
        name: "NHH — Norwegian School of Economics",
        city: "Bergen",
        country: "Norway",
        primaryProgramme:
            "MSc in Economics and Business Administration — Major in Energy, Natural Resources and the Environment (ENE)",
        altProgrammes: [],
        intake: "Autumn 2027 (2-year programme, 2027–2029)",
        appWindow: "Typical international window: Oct 2026 – Jan 2027",
        decisionWindow: "Offers typically by Apr–May 2027",
        notes: [
            "Curriculum: dedicated energy, environment and resource economics track with courses in electricity markets, climate economics, petroleum & energy transition and sustainable energy.",
            "Reputation: Norway’s flagship business school with a strong brand in Nordic energy, shipping and finance ecosystems.",
            "Student life: small, focused campus; compact, outdoorsy city with strong sports culture and easy access to mountains and fjords.",
            "Career: clear pipelines into Equinor, Statkraft, DNV, Norwegian ministries and consulting; strong platform for applied PhD in energy economics.",
        ],
        links: [{ label: "NHH — MSc ENE", href: "NHH_ENE" }],
    },
    {
        key: "cologne",
        name: "University of Cologne / EWI",
        city: "Cologne",
        country: "Germany",
        primaryProgramme:
            "MSc Economic Research or MSc Economics with energy & climate/market courses via EWI and WiSo Faculty",
        altProgrammes: [
            "MSc Economics (energy & environmental economics specialisation)",
        ],
        intake: "Winter Semester 2027/28 (start around Oct 2027)",
        appWindow: "Most applications: Jan – Mar 2027 for Oct 2027 start",
        decisionWindow: "Offers commonly by Apr–Jun 2027",
        notes: [
            "Curriculum: strong focus on micro-based energy and climate policy, market design, competition and regulation, with heavy quantitative and modelling emphasis via EWI.",
            "Reputation: one of Europe’s strongest energy-economics clusters; excellent for market modelling, regulation and PhD pathways.",
            "Student life: large, lively city with a big student population, rich culture and easy rail links across Germany, the Netherlands and Belgium.",
            "Career: strong placement into German and EU utilities, TSOs, regulators, consultancies and research institutes working on power markets and energy transition.",
        ],
        links: [
            {
                label: "WiSo — Master Economic Research",
                href: "COLOGNE_MSC_ECON_RESEARCH",
            },
            { label: "EWI — Institute of Energy Economics", href: "COLOGNE_EWI" },
        ],
    },
    {
        key: "copenhagen",
        name: "University of Copenhagen",
        city: "Copenhagen",
        country: "Denmark",
        primaryProgramme:
            "MSc in Economics (with electives in energy, environmental and climate economics/ESG)",
        altProgrammes: [
            "MSc Environment and Development (more policy & environment focus)",
        ],
        intake: "Autumn 2027 (2-year programme, 2027–2029)",
        appWindow: "Typical deadlines: Nov 2026 – Jan 2027",
        decisionWindow: "Decisions usually by Mar–Apr 2027",
        notes: [
            "Curriculum: rigorous core in micro, macro and econometrics plus specialised courses in environmental/energy/climate economics and policy evaluation.",
            "Reputation: top Nordic university, very strong in economics and methods; well regarded by central banks, ministries, international organisations and ESG-focused finance.",
            "Student life: bike-centric, international and highly liveable city with vibrant café and culture scene and easy access to Sweden and the rest of Europe.",
            "Career: excellent for ESG/transition finance, consulting, macro/climate policy roles and PhD entry, especially when combined with CFA.",
        ],
        links: [
            { label: "UCPH — MSc in Economics", href: "COPENHAGEN_ECON" },
            {
                label: "UCPH — Environment & Development",
                href: "COPENHAGEN_ENV_ECON",
            },
        ],
    },
    {
        key: "oslo",
        name: "University of Oslo (UiO)",
        city: "Oslo",
        country: "Norway",
        primaryProgramme:
            "Master's in Economics (with energy, environmental and climate economics focus)",
        altProgrammes: ["Master's in Environmental and Development Economics"],
        intake: "Autumn 2027 (2-year programme, 2027–2029)",
        appWindow: "International applications often close Nov 2026 – Jan 2027",
        decisionWindow: "Offers typically by Apr 2027",
        notes: [
            "Curriculum: strong theoretical economics base with options in environmental, energy and climate economics, public economics and policy analysis.",
            "Reputation: Norway’s leading comprehensive university with respected economics research and strong links to ministries, the central bank and public agencies.",
            "Student life: capital-city amenities with immediate access to forests, ski trails and the fjord; very outdoorsy and active student culture.",
            "Career: ideal for energy/climate policy, regulation, central bank or ministry roles and research institutes; a good launchpad for a policy-leaning PhD.",
        ],
        links: [
            { label: "UiO — Master's in Economics", href: "UIO_ECON_MSC" },
            { label: "UiO — Main site", href: "UIO" },
        ],
    },
    {
        key: "aalto",
        name: "Aalto University",
        city: "Espoo (Helsinki region)",
        country: "Finland",
        primaryProgramme:
            "MSc in Advanced Energy Solutions — Major in Sustainable Energy Systems and Markets",
        altProgrammes: [
            "MSc in Energy Systems and Technologies",
            "MSc in Sustainable Energy Engineering (engineering-leaning)",
        ],
        intake: "Autumn 2027 (2-year programme, 2027–2029)",
        appWindow: "Typical deadlines: Dec 2026 – Jan 2027",
        decisionWindow: "Offers typically by Apr–May 2027",
        notes: [
            "Curriculum: integrates energy systems modelling, electricity markets, regulation, optimisation and climate policy with a good balance of technical and market components.",
            "Reputation: Finland’s top technical university with a strong European profile in energy systems, smart grids and sustainability innovation.",
            "Student life: modern, international, tech-forward environment with strong startup culture and excellent access to cycling, forests, islands and winter sports.",
            "Career: access to Finnish utilities, TSOs and consultancies plus EU-level energy transition roles; strong fit if you want systems + policy exposure.",
        ],
        links: [
            {
                label: "Aalto — MSc Advanced Energy Solutions",
                href: "AALTO_ADVANCED_ENERGY",
            },
        ],
    },
    {
        key: "lund",
        name: "Lund University",
        city: "Lund",
        country: "Sweden",
        primaryProgramme:
            "MSc in Sustainable Energy Engineering (technical, systems-focused)",
        altProgrammes: [
            "MSc in Environmental Management and Policy (more policy/management)",
        ],
        intake: "Autumn 2027 (2-year programme, 2027–2029)",
        appWindow: "Sweden national round: Oct 2026 – Jan 2027",
        decisionWindow: "Admissions results typically by Mar–Apr 2027",
        notes: [
            "Curriculum: energy conversion, distribution, heat & power systems, renewables, hydrogen and energy efficiency with a strong technical/systems orientation.",
            "Reputation: one of Sweden’s top universities, highly respected in engineering, sustainability and climate-related research.",
            "Student life: classic student-town atmosphere with the renowned Nations, close to Malmö and Copenhagen and strong cycling culture and outdoors access.",
            "Career: excellent for engineering-centric energy roles (R&D, system modelling, energy planning, technical consulting), especially if paired with your own market/finance focus.",
        ],
        links: [
            {
                label: "Lund — MSc Sustainable Energy Engineering",
                href: "LUND_SUSTAINABLE_ENERGY",
            },
        ],
    },
];

type UniTimelineItem = {
    period: string;
    label: string;
    detail: string;
};

const uniTimeline: readonly UniTimelineItem[] = [
    {
        period: "By 1 Oct 2026",
        label: "Tests, transcripts & references ready",
        detail:
            "Have GMAT/GRE, English test scores, Uni Melb transcripts and 2–3 referees lined up so you can move fast once all portals open.",
    },
    {
        period: "1 Dec 2026",
        label:
            "University of Oslo (UiO) MSc Economics – application opens/early deadline",
        detail:
            "Submit your application via the UiO portal by 1 Dec 2026 for the autumn 2027 intake. Study-start in August.",
    },
    {
        period: "1 Dec 2026 – 9 Jan 2027",
        label:
            "Aalto University MSc Advanced Energy Solutions – application window",
        detail:
            "Application period for 2026 intake was 1 Dec – 2 Jan; documents deadline 9 Jan. For 2027 intake assume similar timing.",
    },
    {
        period: "15 Jan 2027 at 23:59 CET",
        label:
            "University of Copenhagen (UCPH) & Lund University international intake deadlines",
        detail:
            "UCPH MSc in Economics deadline 15 Jan; Lund University via universityadmissions.se upload by 15 Jan.",
    },
    {
        period: "15 Feb 2027 (midnight CET)",
        label: "Norwegian School of Economics (NHH) MSc ENE – application deadline",
        detail:
            "Non-Norwegian bachelor’s applicants apply via Søknadsweb by 15 Feb.",
    },
    {
        period: "31 Mar 2027",
        label:
            "University of Cologne / WiSo Faculty – MSc Economic Research application deadline",
        detail:
            "Submit application by 31 Mar 2027 (KLIPS 2.0) for winter semester intake.",
    },
    {
        period: "Apr – May 2027",
        label: "Offer decisions & acceptance deadlines",
        detail:
            "Most universities publish decisions and require acceptance within 2–4 weeks. Refer to each programme’s offer letter.",
    },
    {
        period: "Aug – Oct 2027",
        label: "Arrival, orientation & semester start",
        detail:
            "NHH & UiO start mid-August; Aalto & Lund late August; UCPH early September; Cologne winter semester begins 1 Oct.",
    },
];

/* -------------------------------- TIMELINE --------------------------------- */

type TimelineItem = {
    years: string;
    phase: string;
    focus: string;
    deliverables: string;
};

const timeline: readonly TimelineItem[] = [
    {
        years: "2025–26",
        phase: "Phase 1",
        focus: "Master + CFA I + Dashboard V1 + data/language foundations",
        deliverables: "Public portfolio project + DE/NO basics",
    },
    {
        years: "2027–29",
        phase: "Phase 2",
        focus: "European MSc (ENE focus) + internship + language B1–B2",
        deliverables: "Distinction-target MSc + applied thesis using dashboard",
    },
    {
        years: "2029–32",
        phase: "Phase 3",
        focus: "Corporate roles + CFA II–III + ESG Cert",
        deliverables: "CFA Charter + analyst→strategist progression",
    },
    {
        years: "2032–36",
        phase: "Phase 4",
        focus: "Applied PhD in Energy Econ (preferred) or senior practitioner track",
        deliverables:
            "Publications + industry collaboration or equivalent thought-leadership",
    },
    {
        years: "2036–40",
        phase: "Phase 5",
        focus: "Senior strategy / ESG leadership",
        deliverables:
            "Senior role in Europe or AU; lead major transition initiatives",
    },
    {
        years: "2040–43",
        phase: "Phase 6",
        focus: "Executive / policy leadership & thought leadership",
        deliverables:
            "Director-level/public voice + financial independence trajectory",
    },
];

/* --------------------------------- PAGE UI -------------------------------- */

export default function FuturePlanShell() {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const detailsRefs = useRef<Array<HTMLDetailsElement | null>>([]);

    useEffect(() => {
        if (!rootRef.current) return;

        const ctx = gsap.context(() => {
            gsap.from(".fade-section", {
                opacity: 0,
                y: 16,
                duration: 0.7,
                stagger: 0.08,
                ease: "power2.out",
            });
        }, rootRef);

        return () => ctx.revert();
    }, []);

    const expandAll = () => {
        detailsRefs.current.forEach((d) => {
            if (d) d.open = true;
        });
    };

    const collapseAll = () => {
        detailsRefs.current.forEach((d) => {
            if (d) d.open = false;
        });
    };

    return (
        <main className="min-h-screen bg-zinc-50">
            <div
                ref={rootRef}
                className="mx-auto max-w-5xl px-6 md:px-10 py-10 md:py-16"
            >
                {/* Top bar: name + context + sign out */}
                <header className="mb-10 md:mb-14 flex items-start justify-between text-xs md:text-sm">
                    <div className="space-y-1">
                        <p className="font-display tracking-[0.32em] uppercase text-[11px] text-ink-700">
                            Michael Harrison
                        </p>
                        <p className="text-ink-500">
                            Future plan · 18-year roadmap (private)
                        </p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-ink-500">
                            Melbourne, Australia
                        </p>
                        <Link
                            href="/"
                            className="text-[11px] uppercase tracking-[0.18em] text-ink-500 hover:text-ink-900"
                        >
                            Back
                        </Link>
                    </div>
                </header>

                <div className="space-y-10 md:space-y-12 text-[11px] md:text-sm leading-relaxed text-ink-700">
                    {/* Page header */}
                    <section className="fade-section">
                        <div className="flex flex-wrap items-center gap-3">
                            <Compass className="h-6 w-6" aria-hidden />
                            <h1 className="font-display text-base md:text-lg tracking-[0.2em] uppercase">
                                Future plan · 2025–2043
                            </h1>
                            <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-black/20 px-3 py-1 text-[11px] font-medium">
                                <span role="img" aria-label="crystal ball">
                                    🔮
                                </span>
                                Long-horizon career map
                            </span>
                        </div>
                    </section>

                    {/* Overview */}
                    <Section
                        id="overview"
                        title="Overview of 18-Year Career Master Plan"
                        icon={<Compass className="h-4 w-4" aria-hidden />}
                        className="fade-section"
                    >
                        <p className="text-sm leading-relaxed">{overviewText}</p>
                        <div className="mt-6">
                            <KVGrid rows={overviewRows} />
                        </div>
                    </Section>

                    {/* Execution Principles */}
                    <Section
                        id="execution-principles"
                        title="Execution Principles"
                        icon={<Target className="h-4 w-4" aria-hidden />}
                        className="fade-section"
                    >
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>
                                <span className="font-semibold">One big thing at a time:</span>{" "}
                                at most one formal degree, one major exam (CFA level), and one
                                flagship side project (the dashboard) in any given period.
                            </li>
                            <li>
                                <span className="font-semibold">Model before UI:</span>{" "}
                                prioritise robust data pipelines and econometric models before
                                investing heavily in interface polish.
                            </li>
                            <li>
                                <span className="font-semibold">Endurance as anchor:</span> keep
                                3 non-negotiable weekly sessions (endurance, intensity,
                                strength) to protect long-term physical and mental capacity.
                            </li>
                            <li>
                                <span className="font-semibold">
                                    Option value at each transition:
                                </span>{" "}
                                for each major phase (MSc, PhD, leadership) maintain at least
                                one strong alternative path that still fits the core identity
                                and long-term direction.
                            </li>
                            <li>
                                <span className="font-semibold">Review rhythm:</span> brief
                                quarterly check-ins and a fuller annual reset against this
                                plan.
                            </li>
                        </ul>
                    </Section>

                    {/* Cross-cutting pillars: dashboard, credentials, languages, lifestyle */}

                    <Section
                        id="flagship-dashboard"
                        title="Flagship Platform — Econometric Energy Forecast Dashboard"
                        icon={<ChartLine className="h-4 w-4" aria-hidden />}
                        className="fade-section"
                    >
                        <div className="space-y-3 text-sm">
                            <p>
                                The dashboard is the core visible proof of skill, linking
                                modelling, data engineering and communication across the whole
                                plan.
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>
                                    <span className="font-semibold">Purpose:</span> public,
                                    evolving platform showcasing applied modelling and clear
                                    explanation of uncertainty, scenarios and limitations.
                                </li>
                                <li>
                                    <span className="font-semibold">V1 (2025–26):</span> clean
                                    pipelines for European power data, baseline models and a
                                    minimal public UI.
                                </li>
                                <li>
                                    <span className="font-semibold">V2 (MSc years):</span> richer
                                    scenario analysis, confidence bands and a simple public API;
                                    integrated into MSc thesis.
                                </li>
                                <li>
                                    <span className="font-semibold">V3 (early career):</span>{" "}
                                    near-real-time pipelines, scheduled jobs and alerts built
                                    into day-job workflows.
                                </li>
                                <li>
                                    <span className="font-semibold">
                                        Research/teaching mode (PhD/senior):
                                    </span>{" "}
                                    reproducible labs, student projects and industry
                                    demos/whitepapers.
                                </li>
                            </ul>
                        </div>
                    </Section>

                    <Section
                        id="credentials-roadmap"
                        title="Credentials Roadmap"
                        icon={<BookOpen className="h-4 w-4" aria-hidden />}
                        className="fade-section"
                    >
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>
                                <span className="font-semibold">Master of Finance (Melbourne):</span>{" "}
                                complete by Dec 2026 with strong performance in econometrics and
                                core finance.
                            </li>
                            <li>
                                <span className="font-semibold">CFA Program:</span> Level I by
                                2026, Levels II–III by around 2030, Charterholder status in
                                early 30s.
                            </li>
                            <li>
                                <span className="font-semibold">CFA ESG Certificate:</span> add
                                in the early 2030s to match transition-finance and ESG work.
                            </li>
                            <li>
                                <span className="font-semibold">Applied PhD (preferred):</span>{" "}
                                early 30s industrial PhD in energy economics, but optional if
                                the senior practitioner track is stronger at the time.
                            </li>
                        </ul>
                    </Section>

                    <Section
                        id="language-trajectory"
                        title="Language Trajectory (German & Norwegian)"
                        icon={<Sparkles className="h-4 w-4" aria-hidden />}
                        className="fade-section"
                    >
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>
                                <span className="font-semibold">By 2026:</span> German A2 and
                                Norwegian A1 — basic comprehension and simple conversation.
                            </li>
                            <li>
                                <span className="font-semibold">By end of MSc (2029):</span>{" "}
                                German B1 and Norwegian B2 — comfortable socially and
                                semi-professionally.
                            </li>
                            <li>
                                <span className="font-semibold">By mid-30s:</span> Norwegian
                                B2/C1 and German B2 — professional working proficiency in at
                                least one, with the other stable and usable.
                            </li>
                        </ul>
                    </Section>

                    <Section
                        id="lifestyle-anchor"
                        title="Lifestyle Anchor — Endurance Training"
                        icon={<Target className="h-4 w-4" aria-hidden />}
                        className="fade-section"
                    >
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>
                                Maintain <span className="font-semibold">3 non-negotiable weekly sessions</span>:
                                endurance, intensity/tempo and strength.
                            </li>
                            <li>
                                Average between <span className="font-semibold">6–10 hours/week</span>{" "}
                                depending on phase (higher during MSc / early career).
                            </li>
                            <li>
                                Target <span className="font-semibold">one anchor event per year</span>{" "}
                                (triathlon, marathon, Gran Fondo, etc.) as proof of consistency
                                rather than peak performance.
                            </li>
                            <li>
                                Treat training as a{" "}
                                <span className="font-semibold">support system</span> for
                                clarity, resilience and long-term health, not as a competing
                                goal.
                            </li>
                        </ul>
                    </Section>

                    {/* European graduate options */}
                    <Section
                        id="graduate-options"
                        title="European Graduate Study Options (Post-2026)"
                        icon={<BookOpen className="h-4 w-4" aria-hidden />}
                        className="fade-section"
                    >
                        <div className="space-y-6">
                            <p className="text-sm leading-relaxed">
                                You complete the Master of Finance at Melbourne in{" "}
                                <strong>Dec 2026</strong>. The next step in the plan is a
                                European MSc starting in the{" "}
                                <strong>Autumn 2027 intake</strong>. The strategy is to{" "}
                                <strong>apply to multiple priority programmes</strong> — NHH,
                                University of Cologne (EWI), University of Copenhagen,
                                University of Oslo and selected technical energy programmes —
                                then choose the offer that best aligns with energy economics,
                                markets and longer-term PhD/leadership ambitions.
                            </p>

                            <div className="text-xs space-y-1">
                                <p className="font-semibold uppercase tracking-[0.14em]">
                                    Common entry pattern
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>
                                        Bachelor-level background with strong economics/quant or
                                        related technical training.
                                    </li>
                                    <li>
                                        Solid grades (roughly B-level or equivalent) plus proof of
                                        English (IELTS/TOEFL) and sometimes GMAT/GRE.
                                    </li>
                                    <li>
                                        Applications mostly run from late 2026 to early 2027, with
                                        decisions in spring 2027.
                                    </li>
                                </ul>
                            </div>

                            {/* University cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {uniOptions.map((u) => (
                                    <article
                                        key={u.key}
                                        className="flex flex-col rounded-xl border border-black/15 p-4 space-y-3"
                                    >
                                        <header className="space-y-1">
                                            <h3 className="text-sm font-semibold">{u.name}</h3>
                                            <p className="text-[11px] uppercase tracking-[0.14em] opacity-70">
                                                {u.city}, {u.country}
                                            </p>
                                        </header>
                                        <div className="space-y-2 text-sm">
                                            <p>
                                                <span className="font-semibold">Primary programme:</span>{" "}
                                                {u.primaryProgramme}
                                            </p>
                                            {u.altProgrammes?.length ? (
                                                <p>
                                                    <span className="font-semibold">Alternatives:</span>{" "}
                                                    {u.altProgrammes.join(" · ")}
                                                </p>
                                            ) : null}
                                            <p>
                                                <span className="font-semibold">Intake target:</span>{" "}
                                                {u.intake}
                                            </p>
                                            <p>
                                                <span className="font-semibold">
                                                    Application window (for you):
                                                </span>{" "}
                                                {u.appWindow}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Decision window:</span>{" "}
                                                {u.decisionWindow}
                                            </p>
                                        </div>
                                        <ul className="mt-1 list-disc pl-5 space-y-1 text-xs">
                                            {u.notes.map((n) => (
                                                <li key={n}>{n}</li>
                                            ))}
                                        </ul>
                                        {u.links.length ? (
                                            <div className="pt-2 flex flex-wrap gap-2">
                                                {u.links.map((lnk) => (
                                                    <ExternalLink key={lnk.href} href={lnk.href}>
                                                        {lnk.label}
                                                    </ExternalLink>
                                                ))}
                                            </div>
                                        ) : null}
                                    </article>
                                ))}
                            </div>

                            {/* Intake timeline */}
                            <div className="mt-4 rounded-xl border border-black/15 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" aria-hidden />
                                    <h3 className="text-sm font-semibold">
                                        Application &amp; Intake Timeline (MFin → European MSc)
                                    </h3>
                                </div>
                                <UniTimeline items={uniTimeline} />
                            </div>
                        </div>
                    </Section>

                    {/* Phases */}
                    <section
                        id="phases"
                        className="fade-section scroll-mt-24 space-y-6"
                    >
                        <div className="flex items-end justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4" aria-hidden />
                                <h2 className="font-display text-[13px] md:text-sm font-semibold tracking-[0.16em] uppercase">
                                    Phases
                                </h2>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                <button
                                    onClick={expandAll}
                                    className="inline-flex items-center gap-2 rounded-full border border-black/20 px-3 py-1 hover:underline"
                                >
                                    Expand all
                                </button>
                                <button
                                    onClick={collapseAll}
                                    className="inline-flex items-center gap-2 rounded-full border border-black/20 px-3 py-1 hover:underline"
                                >
                                    Collapse all
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                            {/* Outline */}
                            <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-2 text-xs">
                                {phases.map((p, i) => (
                                    <a
                                        key={p.title}
                                        href={`#phase-${i + 1}`}
                                        className="block rounded-md px-2 py-1 hover:underline"
                                    >
                                        <span className="mr-2 tabular-nums">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
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
                                        className="group rounded-2xl border border-black/20 transition-colors bg-white"
                                        open={idx === 0}
                                        ref={(el) => {
                                            detailsRefs.current[idx] = el;
                                        }}
                                    >
                                        <summary className="flex items-start gap-4 px-5 py-4 cursor-pointer list-none">
                                            {/* Number + years */}
                                            <div className="min-w-16 text-[11px]">
                                                <div className="font-semibold tabular-nums">
                                                    {String(idx + 1).padStart(2, "0")}
                                                </div>
                                                <div className="mt-1 inline-flex items-center rounded-full border border-black/20 px-2 py-0.5">
                                                    {p.years}
                                                </div>
                                            </div>

                                            {/* Title & chips */}
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <span>{p.icon}</span>
                                                    <h3 className="text-sm font-semibold">{p.title}</h3>
                                                    <span className="inline-flex items-center rounded-full border border-black/20 px-2 py-0.5 text-[11px]">
                                                        {p.location}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full border border-black/20 px-2 py-0.5 text-[11px]">
                                                        {p.age} yrs
                                                    </span>
                                                </div>
                                            </div>

                                            <ChevronDown
                                                className="mt-1 h-5 w-5 shrink-0 transition-transform duration-300 group-open:rotate-180"
                                                aria-hidden
                                            />
                                        </summary>

                                        <div className="px-5 pb-5">
                                            {/* Meta */}
                                            {p.meta?.length ? (
                                                <div className="mb-5 flex flex-wrap gap-2 border-t border-black/10 pt-4">
                                                    {p.meta.map((m) => (
                                                        <span
                                                            key={m.label + m.value}
                                                            className="inline-flex items-center gap-1 rounded-full border border-black/20 px-3 py-1 text-xs font-semibold"
                                                        >
                                                            <span className="opacity-80">{m.label}:</span>{" "}
                                                            {m.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}

                                            {/* Sections */}
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                {p.sections.map((s) => (
                                                    <article
                                                        key={s.heading}
                                                        className="rounded-xl border border-black/15 p-4 bg-zinc-50"
                                                    >
                                                        <h4 className="mb-3 text-sm font-semibold">
                                                            {s.heading}
                                                        </h4>
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
                                                                    <ExternalLink
                                                                        key={lnk.href}
                                                                        href={lnk.href}
                                                                    >
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
                                                    <h4 className="mb-2 text-sm font-semibold">
                                                        🎯 Milestones &amp; KPIs
                                                    </h4>
                                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                                        {p.kpis.map((k) => (
                                                            <li key={k}>{k}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : null}

                                            {/* Outcomes */}
                                            {p.outcomes ? (
                                                <div className="mt-6 rounded-xl border-2 border-black p-4 bg-white">
                                                    <h4 className="mb-2 text-sm font-semibold">
                                                        ✅ Outcomes
                                                    </h4>
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
                    </section>

                    {/* Timeline */}
                    <Section
                        id="timeline"
                        title="Timeline"
                        icon={<CalendarDays className="h-4 w-4" aria-hidden />}
                        className="fade-section"
                    >
                        <Timeline items={timeline} />
                    </Section>

                    {/* Footer */}
                    <footer className="fade-section text-[11px] text-ink-500">
                        Review quarterly; update annually. Last updated · Oct 2025.
                    </footer>
                </div>
            </div>
        </main>
    );
}

/* --------------------------------- PARTIALS -------------------------------- */

function Section({
    id,
    title,
    icon,
    children,
    className,
}: {
    id: string;
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section id={id} className={`scroll-mt-24 ${className ?? ""}`}>
            <div className="mb-3 flex items-center gap-2">
                <span>{icon ?? <Compass className="h-4 w-4" aria-hidden />}</span>
                <h2 className="font-display text-[13px] md:text-sm font-semibold tracking-[0.16em] uppercase">
                    {title}
                </h2>
            </div>
            <div className="border-t border-black/15 pt-4">{children}</div>
        </section>
    );
}

function KVGrid({ rows }: { rows: readonly [string, string][] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map(([k, v]) => (
                <div key={k} className="border-t border-black/15 pt-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">
                        {k}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug">{v}</p>
                </div>
            ))}
        </div>
    );
}

function ExternalLink({
    href,
    children,
}: {
    href: keyof typeof L;
    children: ReactNode;
}) {
    return (
        <a
            href={L[href]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] underline-offset-4 decoration-zinc-400 hover:underline"
            aria-label={`${children} (opens in a new tab)`}
        >
            <LinkIcon className="h-3.5 w-3.5" aria-hidden />
            {children}
        </a>
    );
}

/* --------------------------- UNIVERSITY TIMELINE UI ------------------------ */

function UniTimeline({ items }: { items: UniTimelineItem[] }) {
    return (
        <ol className="relative ml-3 border-s border-black/20">
            {items.map((t) => (
                <li key={t.label + t.period} className="ms-6 pb-4 last:pb-0">
                    <span
                        className="absolute -start-1.5 mt-1 h-3 w-3 rounded-full border border-black bg-white"
                        aria-hidden
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-black/20 px-2 py-0.5 text-[11px] font-medium">
                            {t.period}
                        </span>
                        <span className="text-xs font-medium">{t.label}</span>
                    </div>
                    <p className="mt-1 text-xs leading-snug">{t.detail}</p>
                </li>
            ))}
        </ol>
    );
}

/* -------------------------------- TIMELINE UI ------------------------------ */

function Timeline({ items }: { items: TimelineItem[] }) {
    return (
        <ol className="relative ml-3 border-s border-black/20">
            {items.map((t) => (
                <li key={t.phase} className="ms-6 pb-6 last:pb-0">
                    <span
                        className="absolute -start-1.5 mt-1 h-3 w-3 rounded-full border border-black bg-white"
                        aria-hidden
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-black/20 px-2 py-0.5 text-[11px] font-medium">
                            {t.years}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-[0.14em]">
                            {t.phase}
                        </span>
                    </div>
                    <p className="mt-2 text-xs leading-snug">
                        <span className="font-semibold">Focus:</span> {t.focus}
                    </p>
                    <p className="text-xs leading-snug">
                        <span className="font-semibold">Key deliverables:</span>{" "}
                        {t.deliverables}
                    </p>
                </li>
            ))}
        </ol>
    );
}