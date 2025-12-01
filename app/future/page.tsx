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
    "Building a globally oriented career at the intersection of energy economics, sustainability strategy, and finance — anchored by a flagship econometric energy-forecast dashboard, technical fluency, language capability, and a disciplined endurance-sport lifestyle. By age 40, the goal is to be a senior energy/ESG strategy or policy leader with a global profile, bridging finance, data analytics, and policy to guide the energy transition. The plan emphasises execution discipline, option value at each transition, and long-term performance through academic excellence, multilingual fluency, and endurance athletics.";

const overviewRows: Array<[string, string]> = [
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
    INSEAD_ENERGY: "https://www.insead.edu/executive-education/energy-transition",
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
                    "Maintain strong Master of Finance grades, prioritising econometrics, derivatives and core finance subjects (target completion: Dec 2026).",
                    "Sit CFA Level I in mid-2026 with structured prep from late 2025.",
                    "Complete IBM Python for Data Science, Data Analyst with R (DataCamp), and LSE Stata certificates by end-2026 (with flexibility to push one into early 2027 if workload spikes).",
                    "Tier 1 priorities: MFin performance, CFA I, Dashboard v1, German A1–A2 & Norwegian A1. Tier 2: extra blog posts or early additional certs.",
                ],
                links: [
                    { label: "IBM Python for Data Science (Coursera)", href: L.IBM_PY_DS },
                    { label: "Data Analyst with R (DataCamp)", href: L.DATACAMP_R },
                    { label: "LSE — Data Analysis Using Stata", href: L.LSE_STATA },
                    { label: "CFA Institute", href: L.CFA },
                ],
            },
            {
                heading: "💻 Flagship Project — Econometric Energy Forecast Dashboard",
                bullets: [
                    "2025: V0 — build clean pipelines for a few Nord Pool / ENTSO-E series and simple baseline models (e.g. ARIMA or small VAR) for day-ahead prices.",
                    "2026: V1 — extend to multi-variable VAR/SVAR integrating fuel prices, macro indicators and geopolitical risk; add basic evaluation metrics (MAPE/RMSE) and charts.",
                    "Stack: FastAPI (or similar) backend serving forecasts as JSON with a minimal dashboard UI (Dash/Streamlit/React) deployed publicly.",
                    "Documentation: clear README, architecture notes and at least one substantial blog post or working-paper-style PDF explaining methodology, data, and limitations.",
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
                bullets: [
                    "German A1→A2 (Goethe-Institut), aiming to sit A2 toward late 2026 if pacing allows.",
                    "Norwegian A1 via Folkeuniversitetet or FutureLearn, with consistent light input (NRK, simple podcasts, apps).",
                ],
                links: [
                    { label: "Goethe-Institut", href: L.GOETHE },
                    { label: "Folkeuniversitetet (NO)", href: L.FOLKE },
                    { label: "FutureLearn — Norwegian", href: L.FUTURELEARN_NO },
                ],
            },
            {
                heading: "🏃 Lifestyle & Events",
                bullets: [
                    "6–8 h/wk training with a stable base: at least one long endurance session, one intensity/tempo session, and one strength session per week.",
                    "Enter and complete at least one sprint triathlon or Gran Fondo by end-2026, as proof of consistency rather than peak performance.",
                ],
            },
        ],
        meta: [
            { label: "Focus", value: "Foundations + visible portfolio" },
            { label: "Training", value: "6–8 h/wk endurance" },
        ],
        kpis: [
            "CFA Level I: PASS",
            "Dashboard v1 live with public demo",
            "≥1 substantive post or working paper on methodology",
            "German A2 · Norwegian A1",
        ],
        outcomes: [
            "Master of Finance almost complete (Dec 2026)",
            "Public, working prototype dashboard (V1)",
            "Python/R/Stata certifications",
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
                    "MSc ENE at NHH focusing on energy economics, sustainability and geopolitics, with comparable European programmes (Copenhagen, Cologne, Oslo, etc.) as viable alternatives.",
                    "Secure an energy/market analytics or data-strategy internship (Equinor, Statkraft, DNV or similar).",
                    "Thesis extends the dashboard into formal academic econometric research with a replication package (code + data appendix).",
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
                    "Model exogenous shocks from weather regimes, geopolitical risk, and carbon prices into European power and gas markets.",
                    "Dashboard v2: scenario analysis, confidence bands and a simple public API for selected forecasts.",
                    "Give at least one seminar talk; submit an extended abstract to an IAEE student/young professional session.",
                ],
                links: [{ label: "IAEE", href: L.IAEE }],
            },
            {
                heading: "🌍 Language Progress",
                bullets: [
                    "German A2→B1, targeting Goethe B1 by the end of the MSc window if feasible.",
                    "Norwegian B1→B2 via NHH Norsk and immersion; able to operate socially and semi-professionally in Norwegian.",
                ],
                links: [
                    { label: "Goethe-Institut", href: L.GOETHE },
                    { label: "NHH — Norwegian Courses", href: L.NHH_NORSK },
                ],
            },
            {
                heading: "🏃 Activities",
                bullets: [
                    "8–10 h/wk training with BSI Cycling & Athletics or equivalent local clubs.",
                    "Race local triathlons and/or Bergen Marathon as annual anchors.",
                ],
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
            "Thesis submitted with code/data appendix",
            "Dashboard v2 (scenarios + API)",
        ],
        outcomes: [
            "MSc with distinction (target)",
            "Dual language capability (DE/NO)",
            "Dashboard recognised as applied research tool",
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
                    "Energy / ESG / Market Analyst → Associate → Strategist in utilities, TSOs, consultancies (Statkraft, DNV, Ørsted, etc.) or transition-focused finance roles.",
                    "Apply CFA skills to transition-finance, project evaluation, and portfolio decarbonisation work.",
                    "Produce quarterly market notes or strategy memos that leverage dashboard outputs for internal stakeholders.",
                ],
                links: [
                    { label: "Statkraft", href: L.STATKRAFT },
                    { label: "DNV", href: L.DNV },
                    { label: "Ørsted", href: L.ORSTED },
                ],
            },
            {
                heading: "🎓 Professional Credentials",
                bullets: [
                    "Complete CFA Levels II and III on schedule (e.g. L2 ~2027/28, L3 ~2030) and obtain the CFA Charter by ~2031.",
                    "Add the CFA ESG Certificate around 2031–2032.",
                ],
                links: [
                    { label: "CFA Institute", href: L.CFA },
                    { label: "CFA — ESG Certificate", href: L.CFA_ESG },
                ],
            },
            {
                heading: "🛠 Platform Continuity",
                bullets: [
                    "Dashboard v3: near-real-time pipelines, automated forecast jobs and alerting for key risk events.",
                    "Publish at least one external professional article (industry publication, journal, or think-tank note) and present internally on methods and lessons learned.",
                ],
            },
        ],
        meta: [
            { label: "Comp (guide)", value: "NOK 650–850k (≈ AUD 95–125k)" },
            { label: "Languages", value: "Maintain DE/NO at B2" },
        ],
        kpis: [
            "CFA Charterholder by ~2031",
            "≥1 external publication",
            "Dashboard v3 (automated pipeline + alerts)",
        ],
        outcomes: [
            "CFA Charterholder with ESG credential",
            "Recognised technical + strategic analyst",
            "Operational forecasting platform embedded in workflow",
        ],
    },
    {
        title: "Phase 4 — Applied PhD in Energy Economics (preferred) / Alternative Track",
        years: "2032–2036",
        location: "NHH / UiO / EU partner",
        age: "29–33",
        icon: <Target className="h-5 w-5" />,
        sections: [
            {
                heading: "🎓 Program & Topic (Preferred Path)",
                bullets: [
                    "Industrial or applied PhD partnership (Equinor, DNV, Statkraft, TSO, or policy agency).",
                    "Dissertation on energy security, market integration and geopolitics (e.g. shock transmission across power, gas and carbon markets).",
                    "Dashboard embedded as a reproducible research and teaching platform (labs, student projects, demos).",
                ],
                links: [{ label: "University of Oslo (UiO)", href: L.UIO }],
            },
            {
                heading: "📚 Publishing & Conferences",
                bullets: [
                    "Publish 2–3 peer-reviewed papers (Energy Economics, Applied Energy, Sustainable Finance & Investment or similar).",
                    "Present at IAEE and key European energy conferences; maintain at least occasional practitioner-facing writing.",
                ],
                links: [
                    { label: "Energy Economics", href: L.JOURNAL_ENERGY_ECON },
                    { label: "Applied Energy", href: L.JOURNAL_APPLIED_ENERGY },
                    { label: "Sustainable Finance & Investment", href: L.JOURNAL_SFI },
                    { label: "IAEE", href: L.IAEE },
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
            "PhD proposal approved (Y1) & defense (Y4), or equivalent senior-practitioner promotion",
            "≥2 peer-reviewed or equivalent high-quality publications",
            "Dashboard leveraged as recognised research/teaching or industry tool",
        ],
        outcomes:
            "Preferred: PhD + CFA + production-grade portfolio = practitioner-researcher profile. Alternative: senior practitioner with strong publications and recognised modelling platform.",
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
                    "Senior Energy Economist, Head of Market Analysis, or Strategy Manager in major energy companies, TSOs, or advisory firms (Equinor, DNV, Ørsted, etc.).",
                    "ESG/Sustainability Strategy Lead or Head of Transition Finance in banks, asset managers, or infrastructure funds.",
                    "Option to pivot to Australia into roles at AEMO, ARENA, CSIRO, CEFC, or major banks/super funds.",
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
                heading: "📈 Impact & Positioning",
                bullets: [
                    "Own multi-year transition workstreams (e.g. decarbonisation roadmaps, security-of-supply strategies, grid or asset investment plans).",
                    "Lead teams of analysts; run an internal methods guild/community around forecasting, energy economics and policy modelling.",
                    "Clarify and lean into your preferred archetype: corporate strategy leader (firm-level impact) or policy/think-tank leader (system-level impact).",
                ],
            },
            {
                heading: "🏃 Lifestyle & Balance",
                bullets: [
                    "Maintain 6–8 h/wk training with one major event per year (Ironman 70.3, Gran Fondo, or marathon).",
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
                    "Executive Director, Head of Strategy, Chief Economist or Senior Policy Advisor role in a major energy, financial, or policy institution.",
                    "Contribute regularly to public discourse on the energy transition (op-eds, reports, podcasts, conferences).",
                    "Maintain a structured mentorship habit (1:1s, internal cohorts, or guest lectures at universities).",
                ],
            },
            {
                heading: "🎓 Executive Education & Network",
                bullets: [
                    "Optionally complete an executive energy-transition or leadership program (INSEAD, Oxford or similar) to deepen network and broaden perspective.",
                ],
                links: [
                    { label: "INSEAD — Energy Transition (Exec Ed)", href: L.INSEAD_ENERGY },
                    { label: "Oxford Saïd — Executive Education", href: L.OXFORD_SAID },
                ],
            },
            {
                heading: "🏃 Lifestyle & Independence",
                bullets: [
                    "Financial independence or close to it; work becomes primarily impact- and interest-driven.",
                    "Endurance training (6–8 h/wk) remains a lifestyle anchor, supporting clarity and longevity.",
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
            "Internationally visible strategy/policy leader with durable impact, financial independence, and a sustainable, family-centred lifestyle.",
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

const uniOptions: UniOption[] = [
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
            "Entry: requires a bachelor’s-equivalent with ~90 ECTS in economics/business; competitive GPA (around B-level) and GMAT/GRE plus proof of English (e.g. IELTS/TOEFL).",
            "Curriculum: dedicated energy, environment and resource economics track — courses in electricity markets, climate economics, petroleum & energy transition, and sustainable energy.",
            "Reputation: Norway’s flagship business school; very strong brand in Nordic energy, shipping and finance ecosystems.",
            "Student life: small, focused campus; Bergen is compact, outdoorsy, with easy access to mountains and fjords; strong sports culture (BSI, local cycling and running clubs).",
            "Career prospects: pipelines into Equinor, Statkraft, DNV, Norwegian ministries and consulting; solid platform for applied PhD in energy economics later.",
            "Salary: typical early-career packages in Norway ~NOK 650–850k within a few years post-MSc, with high upside in energy and strategy roles.",
        ],
        links: [{ label: "NHH — MSc ENE", href: L.NHH_ENE }],
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
            "Entry: econ/finance bachelor-equivalent with substantial ECTS in economics plus statistics/econometrics; proof of English (e.g. TOEFL iBT around 90–95 / IELTS around 6.5–7) and sometimes GRE/GMAT.",
            "Curriculum: heavy on micro-based energy and climate policy, market design, competition and regulation; strong quantitative and modelling emphasis through EWI.",
            "Reputation: one of Europe’s strongest energy-economics clusters; excellent for those targeting market modelling, regulation, and PhD pathways.",
            "Student life: Cologne is a big, lively city with a large student population, lots of culture, and easy rail links across Germany, the Netherlands and Belgium.",
            "Career prospects: strong placement into German and EU utilities, TSOs, regulators, consultancies and research institutes working on power markets and energy transition.",
            "Salary: German energy/consulting roles typically start slightly below Nordic packages but catch up with experience; cost of living lower than Norway/Denmark.",
        ],
        links: [
            { label: "WiSo — Master Economic Research", href: L.COLOGNE_MSC_ECON_RESEARCH },
            { label: "EWI — Institute of Energy Economics", href: L.COLOGNE_EWI },
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
            "Entry: usually requires a bachelor-equivalent in economics (or very close) with solid coverage of micro, macro, maths and econometrics; English requirement typically around IELTS 6.5+ or equivalent.",
            "Curriculum: rigorous core in micro, macro, and econometrics plus specialised courses in environmental/energy/climate economics and policy evaluation.",
            "Reputation: top Nordic university; very strong in economics and methods — well regarded by central banks, ministries, international organisations and ESG-focused finance.",
            "Student life: Copenhagen is bike-centric, international, and very liveable; vibrant café and culture scene with easy access to Sweden and the rest of Europe.",
            "Career prospects: excellent for ESG/transition finance, consulting, macro/climate policy roles, and PhD entry; strong signalling value combined with CFA.",
            "Salary: Danish graduate roles in government, finance and energy typically start around the same ballpark as Norway (slightly lower net, but still high relative to cost of living).",
        ],
        links: [
            { label: "UCPH — MSc in Economics", href: L.COPENHAGEN_ECON },
            { label: "UCPH — Environment & Development", href: L.COPENHAGEN_ENV_ECON },
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
            "Entry: requires a solid specialisation in economics (around 80 ECTS) with a minimum grade average comparable to Norwegian C or better, plus English proficiency (e.g. TOEFL ~90 / IELTS ~6.5 or above).",
            "Curriculum: strong theoretical economics base with options in environmental, energy and climate economics, public economics and policy analysis.",
            "Reputation: Norway’s leading comprehensive university; respected for research in economics and strong links to ministries, the central bank, and public agencies.",
            "Student life: Oslo combines capital-city amenities with immediate access to forests, ski trails and the fjord; highly outdoorsy and active student culture.",
            "Career prospects: ideal if you lean toward energy/climate policy, regulation, central bank or ministry roles, and research institutes; also a good launchpad for a policy-leaning PhD.",
            "Salary: public-sector roles pay below top corporate packages but are still strong by international standards, with high job security and work–life balance.",
        ],
        links: [
            { label: "UiO — Master's in Economics", href: L.UIO_ECON_MSC },
            { label: "UiO — Main site", href: L.UIO },
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
            "Entry: strong preference for engineering/natural-science backgrounds; however, quantitative applicants from economics/finance can be admitted if math/econometrics and programming skills are well-demonstrated.",
            "Curriculum: integrates energy systems modelling, electricity markets, regulation, optimisation, and climate policy; good balance of technical and market components.",
            "Reputation: Aalto is Finland’s top technical university with a strong European profile in energy systems, smart grids, and sustainability innovation.",
            "Student life: Helsinki/Esboo area is modern, international, and tech-forward; strong startup culture; excellent cycling, forests, islands and winter sports.",
            "Career prospects: access to Finnish utilities, TSOs, consultancies (Fortum, Fingrid, AFRY), plus EU-level energy transition roles; strong systems + policy contribution.",
            "Salary: Finland offers solid early-career salaries with relatively low living costs compared to Norway/Denmark; good quality-of-life and work–life culture.",
        ],
        links: [
            {
                label: "Aalto — MSc Advanced Energy Solutions",
                href: "https://www.aalto.fi/en/study-options/masters-programme-in-advanced-energy-solutions",
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
            "Entry: requires an engineering-related bachelor’s background with strong calculus/physics/thermodynamics; applicants from finance/economics must show exceptional quantitative preparation, so this is a stretch option.",
            "Curriculum: energy conversion, distribution, heat & power systems, renewables, hydrogen, energy efficiency; heavy technical/systems orientation with some policy integration.",
            "Reputation: Lund is one of Sweden’s top universities, highly respected in engineering, sustainability, and climate-related research.",
            "Student life: vibrant student-town atmosphere with the renowned ‘Nations’; close to Malmö and Copenhagen; strong cycling culture and outdoors access.",
            "Career prospects: excellent for engineering-centric energy roles (R&D, system modelling, energy planning, technical consulting); less aligned for energy-econ/markets unless supplemented with your own research focus.",
            "Salary: Swedish energy engineering roles offer good early-career packages with strong social benefits and a high quality of life.",
        ],
        links: [
            {
                label: "Lund — MSc Sustainable Energy Engineering",
                href: "https://www.lunduniversity.lu.se/lubas/i-uoh-lu-TAREE",
            },
        ],
    },
];

type UniTimelineItem = {
    period: string;
    label: string;
    detail: string;
};

const uniTimeline: UniTimelineItem[] = [
    {
        period: "By 1 Oct 2026",
        label: "Tests, transcripts & references ready",
        detail:
            "Have GMAT/GRE, English test scores, Uni Melb transcripts, and 2–3 referees lined up so you can move fast once all portals open.",
    },
    {
        period: "1 Dec 2026",
        label: "University of Oslo (UiO) MSc Economics – application opens/early deadline",
        detail:
            "Submit your application via the UiO portal by 1 Dec 2026 for the autumn 2027 intake. Study-start in August. See: https://www.uio.no/english/studies/programmes/economics-master/ (link) ",
    },
    {
        period: "1 Dec 2026 – 9 Jan 2027",
        label: "Aalto University MSc Advanced Energy Solutions – application window",
        detail:
            "Application period for 2026 intake was 1 Dec – 2 Jan; documents deadline 9 Jan. So for 2027 intake assume similar: open 1 Dec 2026, close early Jan 2027. See: https://www.aalto.fi/en/study-at-aalto/apply-to-masters-programmes (link)",
    },
    {
        period: "15 Jan 2027 at 23:59 CET",
        label: "University of Copenhagen (UCPH) & Lund University international intake deadlines",
        detail:
            "UCPH MSc in Economics deadline 15 Jan; Lund University via universityadmissions.se upload by 15 Jan. See UCPH: https://www.ku.dk/studies/masters/economics/ (link) and Lund: https://www.lunduniversity.lu.se/lubas/i-uoh-lu-TAREE (link).",
    },
    {
        period: "15 Feb 2027 (midnight CET)",
        label: "Norwegian School of Economics (NHH) MSc ENE – application deadline",
        detail:
            "Non-Norwegian bachelor’s applicants apply via Søknadsweb by 15 Feb. See: https://www.nhh.no/en/study-programmes/application-and-admission/admission-msc-in-economics-and-business-administration/ (link)",
    },
    {
        period: "31 Mar 2027",
        label: "University of Cologne / WiSo Faculty – MSc Economic Research application deadline",
        detail:
            "Submit application by 31 Mar 2027 (KLIPS 2.0) for winter semester intake. See: https://www.wiso.uni-koeln.de/en/studies/application/master/master-economic-research/ (link)",
    },
    {
        period: "Apr – May 2027",
        label: "Offer decisions & acceptance deadlines",
        detail:
            "Most universities (Aalto: early April; NHH: end April; Copenhagen: ~1 May) publish decisions and require acceptance within 2–4 weeks. Refer to each programme’s offer letter.",
    },
    {
        period: "Aug – Oct 2027",
        label: "Arrival, orientation & semester start",
        detail:
            "NHH & UiO start mid-August; Aalto & Lund late August; UCPH early September; Cologne winter semester begins 1 Oct with mid-Oct lectures. Plan relocation accordingly.",
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
    {
        years: "2025–26",
        phase: "Phase 1",
        focus: "Master + CFA I + Dashboard v1 + Data/Lang Foundations",
        deliverables: "Public portfolio project + DE/NO basics",
    },
    {
        years: "2027–29",
        phase: "Phase 2",
        focus: "European MSc (ENE focus) + Internship + Lang B1–B2",
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
        deliverables: "Publications + industry collab or equivalent thought-leadership",
    },
    {
        years: "2036–40",
        phase: "Phase 5",
        focus: "Senior Strategy / ESG Leadership",
        deliverables: "Senior role in Europe or AU; lead major transition initiatives",
    },
    {
        years: "2040–43",
        phase: "Phase 6",
        focus: "Executive / Policy Leadership & Thought Leadership",
        deliverables: "Director-level / public voice + financial independence trajectory",
    },
];

/* --------------------------------- PAGE UI -------------------------------- */

export default function FuturePlanPage() {
    return (
        <div className="mx-auto max-w-3xl px-5 py-8 lg:py-12 space-y-10">
            {/* Header */}
            <header className="flex flex-wrap items-center gap-3">
                <Compass className="h-6 w-6" />
                <h1 className="text-xl font-medium tracking-[0.2em] uppercase">
                    Future plan · 2025–2043
                </h1>
                <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-black/20 px-3 py-1 text-[11px] font-medium">
                    <span role="img" aria-label="crystal ball">
                        🔮
                    </span>
                    Long-horizon career map
                </span>
            </header>

            {/* Overview */}
            <Section
                id="overview"
                title="Overview of 18-Year Career Master Plan"
                icon={<Compass className="h-5 w-5" />}
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
                icon={<Target className="h-5 w-5" />}
            >
                <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>
                        <span className="font-semibold">One big thing at a time:</span> at most one
                        formal degree, one major exam (CFA level), and one flagship side project (the
                        dashboard) in any given period.
                    </li>
                    <li>
                        <span className="font-semibold">Model before UI:</span> prioritise robust data
                        pipelines and econometric models before investing heavily in interface polish.
                    </li>
                    <li>
                        <span className="font-semibold">Endurance as anchor:</span> keep 3 non-negotiable
                        weekly sessions (endurance, intensity, strength) to protect long-term physical and
                        mental capacity.
                    </li>
                    <li>
                        <span className="font-semibold">Option value at each transition:</span> for each
                        major phase (MSc, PhD, leadership) maintain at least one strong alternative path
                        that still fits the core identity and long-term direction.
                    </li>
                </ul>
            </Section>

            {/* New section: European graduate study options */}
            <Section
                id="graduate-options"
                title="European Graduate Study Options (Post-2026)"
                icon={<BookOpen className="h-5 w-5" />}
            >
                <div className="space-y-6">
                    <p className="text-sm leading-relaxed">
                        You complete the Master of Finance at Melbourne in{" "}
                        <strong>Dec 2026</strong>. The next step in the plan is a European MSc starting in
                        the <strong>Autumn 2027 intake</strong>. The strategy is to{" "}
                        <strong>apply to multiple priority programmes</strong> — NHH, University of Cologne
                        (EWI), University of Copenhagen, University of Oslo, and selected technical energy
                        programmes — and then choose the offer that best aligns with energy economics,
                        markets, and your longer-term PhD and leadership goals.
                    </p>

                    {/* University cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {uniOptions.map((u) => (
                            <article
                                key={u.key}
                                className="flex flex-col rounded-2xl border border-black/20 p-4 space-y-3"
                            >
                                <header className="space-y-1">
                                    <h3 className="text-base font-bold">{u.name}</h3>
                                    <p className="text-xs uppercase tracking-wide opacity-70">
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
                                        <span className="font-semibold">Intake target:</span> {u.intake}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Application window (for you):</span>{" "}
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
                    <div className="mt-4 rounded-2xl border border-black/20 p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            <h3 className="text-sm font-bold">
                                Application & Intake Timeline (MFin completion → European MSc start)
                            </h3>
                        </div>
                        <UniTimeline items={uniTimeline} />
                    </div>
                </div>
            </Section>

            {/* Phases — Minimalist, airy, with toolbar & sticky meta column */}
            <section id="phases" className="scroll-mt-24">
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        <h2 className="text-base font-semibold tracking-[0.16em] uppercase">
                            Phases
                        </h2>
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
                    <aside className="lg:col-span-3 lg:sticky lg:top-20 space-y-2 text-xs">
                        {phases.map((p, i) => (
                            <a
                                key={p.title}
                                href={`#phase-${i + 1}`}
                                className="block rounded-md px-2 py-1 text-sm hover:underline"
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
                                className={[
                                    "group rounded-2xl border border-black/20 transition-colors",
                                    "[&[open]>summary>svg.chev]:rotate-180",
                                ].join(" ")}
                                open={idx === 0}
                            >
                                <summary className="flex items-start gap-4 px-5 py-4 cursor-pointer list-none">
                                    {/* Number + meta block */}
                                    <div className="min-w-16 text-xs">
                                        <div className="font-semibold tabular-nums">
                                            {String(idx + 1).padStart(2, "0")}
                                        </div>
                                        <div className="mt-1 inline-flex items-center rounded-full border border-black/20 px-2 py-0.5 text-[11px]">
                                            {p.years}
                                        </div>
                                    </div>

                                    {/* Title + badges */}
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

                                    {/* Chevron */}
                                    <ChevronDown
                                        className="chev mt-1 h-5 w-5 shrink-0 transition-transform duration-300"
                                        aria-hidden
                                    />
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
                                                    <span className="opacity-80">{m.label}:</span>{" "}
                                                    {m.value}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}

                                    {/* Sections grid */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {p.sections.map((s) => (
                                            <article
                                                key={s.heading}
                                                className="rounded-xl border border-black/20 p-4"
                                            >
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
                                            <h4 className="mb-2 text-base font-bold">
                                                🎯 Milestones & KPIs
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
                <h2 className="text-base font-semibold tracking-[0.16em] uppercase">
                    {title}
                </h2>
            </div>
            <div className="border-t border-black/20 pt-4">{children}</div>
        </section>
    );
}

function KVGrid({ rows }: { rows: Array<[string, string]> }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map(([k, v]) => (
                <div key={k} className="border-t border-black/20 pt-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">{k}</p>
                    <p className="mt-1 text-sm font-medium leading-snug">{v}</p>
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
                        <span className="font-semibold">Key deliverables:</span> {t.deliverables}
                    </p>
                </li>
            ))}
        </ol>
    );
}
