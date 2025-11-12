"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
    Compass, Target, Rocket, Calendar, BookOpen, Briefcase, Trophy, Languages,
} from "lucide-react";

export const metadata = {
    title: "Career Plan",
    description: "18-year master plan (2025–2043)",
};

// ---------- DATA FROM USER ----------
const overview = {
    updated: "Updated 18-year master plan (2025 → ~2043, to age 40)",
    theme: [
        { k: "Identity", v: "Energy-economics & sustainability strategist with finance + data expertise" },
        { k: "Education", v: "Master of Finance → CFA I–III → MSc ENE @ NHH → PhD (Energy Econ)" },
        { k: "Technical", v: "Python · R · Stata certified + Forecasting Dashboard" },
        { k: "Languages", v: "German (B2) · Norwegian (B2/C1)" },
        { k: "Career arc", v: "Student → Analyst → Strategist → Executive / Policy Advisor" },
        { k: "Lifestyle", v: "Structured endurance-sport routine + family + balance" },
        { k: "Vision by 40", v: "Senior energy/ESG strategy or policy leader with global profile and financial independence" },
    ],
};

type Bullet = string | { title: string; items?: string[] };

type Phase = {
    title: string;
    years: string;
    location: string;
    age: string;
    sections: { icon?: JSX.Element; heading: string; bullets: Bullet[] }[];
    outcome?: string[] | string;
    salary?: string;
    lifestyle?: string;
    languages?: string;
};

const phases: Phase[] = [
    {
        title: "Phase 1 — Skill Expansion & Project Launch",
        years: "2025–2026",
        location: "Australia",
        age: "22–24",
        sections: [
            {
                icon: <BookOpen className="h-5 w-5" />,
                heading: "Academics & Qualifications",
                bullets: [
                    "Continue Master of Finance (finish 2026).",
                    "CFA Level I (mid-2026) and begin Level II (early 2027) prep.",
                    {
                        title: "Complete Python, R, and Stata short certificates:",
                        items: [
                            "IBM Python for Data Science (Coursera)",
                            "Data Analyst with R (DataCamp)",
                            "LSE Data Analysis Using Stata",
                        ],
                    },
                ],
            },
            {
                icon: <Target className="h-5 w-5" />,
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
                icon: <Languages className="h-5 w-5" />,
                heading: "Languages",
                bullets: [
                    "Start German A1–A2 with Goethe-Institut (online or in-person).",
                    "Begin Norwegian A1 (Folkeuniversitetet online or FutureLearn).",
                ],
            },
            {
                icon: <Trophy className="h-5 w-5" />,
                heading: "Lifestyle",
                bullets: ["6–8 h/wk cycling/running training.", "Compete in a sprint triathlon or Gran Fondo."],
            },
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
                icon: <BookOpen className="h-5 w-5" />,
                heading: "Goals",
                bullets: [
                    "MSc in Energy, Natural Resources & Environment (energy economics, sustainability, geopolitics).",
                    "Internship @ Equinor, Statkraft, or DNV (ideally data/strategy role).",
                    "Thesis expands the dashboard into academic econometric research.",
                ],
            },
            {
                icon: <Languages className="h-5 w-5" />,
                heading: "Languages",
                bullets: ["German B1 (Goethe)", "Norwegian B1–B2 (NHH Norsk courses)"],
            },
            {
                icon: <Trophy className="h-5 w-5" />,
                heading: "Lifestyle",
                bullets: ["8–10 h/wk training with BSI Cycling & Athletics.", "Race local triathlons or Bergen Marathon."],
            },
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
                icon: <Briefcase className="h-5 w-5" />,
                heading: "Career",
                bullets: [
                    "Energy / ESG Analyst → Associate → Strategist (Statkraft, DNV, Ørsted, or finance).",
                    "Apply CFA skills to ESG/transition-finance work.",
                    "Sit CFA Level III (2030) → achieve CFA Charter (2031).",
                    "Add CFA ESG Certificate.",
                ],
            },
            {
                icon: <Rocket className="h-5 w-5" />,
                heading: "Development",
                bullets: [
                    "Publish at least one professional article (energy markets or policy).",
                    "Maintain your dashboard — integrate new data and automate forecasts.",
                ],
            },
            {
                icon: <Languages className="h-5 w-5" />,
                heading: "Languages",
                bullets: ["Maintain German B2 and Norwegian B2 proficiency."],
            },
        ],
        salary: "NOK 650–850k (≈ AUD 95–125k)",
        lifestyle: "Stable training · 8–10 h/wk",
        outcome: [
            "Full CFA Charterholder",
            "Recognised as a technical + strategic analyst",
            "Real-world proof of forecasting and data analytics skill",
        ],
    },
    {
        title: "Phase 4 — Applied PhD in Energy Economics",
        years: "2032–2036",
        location: "NHH / UiO / EU partner",
        age: "29–33",
        sections: [
            {
                icon: <BookOpen className="h-5 w-5" />,
                heading: "Focus",
                bullets: [
                    "Industrial-PhD partnership (Equinor, DNV, or policy agency).",
                    "Dissertation: Energy security, geopolitics, and market integration.",
                    "Integrate dashboard as a research/teaching tool.",
                    "Publish 2–3 papers (Energy Economics, Applied Energy, Sustainable Finance & Investment).",
                    "Present at IAEE and European energy conferences.",
                ],
            },
            {
                icon: <Trophy className="h-5 w-5" />,
                heading: "Lifestyle",
                bullets: ["Family years · 6 h/wk training."],
            },
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
                icon: <Briefcase className="h-5 w-5" />,
                heading: "Roles",
                bullets: [
                    "Senior Energy Economist / Strategy Manager (Equinor, DNV, Ørsted).",
                    "ESG or Sustainability Strategy Lead (finance or industry).",
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
                icon: <Target className="h-5 w-5" />,
                heading: "Goals",
                bullets: [
                    "Executive Director / Head of Strategy / Policy Advisor role.",
                    "Contribute to public discourse on the global energy transition.",
                    "Mentor younger professionals; guest lecture at universities.",
                    "Consider post-PhD Executive Program in Energy Transition (INSEAD / Oxford).",
                ],
            },
        ],
        outcome: ["Financial independence; work-life-family equilibrium.", "Continue endurance training as lifestyle anchor."],
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

// ---------- PAGE ----------
export default function CareerPlanPage() {
    const completion = useMemo(() => {
        // lightweight illustrative progress: phases with explicit “Outcome” count as planned steps
        const total = phases.length + credentialMap.length + summaryTimeline.length;
        const done = 0; // wire up to persisted progress later
        return Math.round((done / Math.max(total, 1)) * 100);
    }, []);

    return (
        <div className="mx-auto max-w-6xl p-4 lg:p-8 space-y-6">
            {/* Header */}
            <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight flex items-center gap-3">
                        <Compass className="h-8 w-8" /> Career Plan
                    </h1>
                    <p className="text-muted-foreground">{overview.updated}</p>
                </div>
                <div className="w-full md:w-80">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span>{completion}% complete</span>
                        <Rocket className="h-4 w-4" />
                    </div>
                    <Progress value={completion} />
                </div>
            </motion.header>

            {/* Overview */}
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-2xl"><Target className="h-6 w-6" /> Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {overview.theme.map((row) => (
                                <div key={row.k} className="rounded-2xl border p-3">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.k}</p>
                                    <p className="font-medium">{row.v}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.section>

            {/* Phases */}
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Tabs defaultValue="Phase 1" className="w-full">
                    <TabsList className="w-full grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6">
                        {phases.map((p) => (
                            <TabsTrigger key={p.title} value={p.title}>
                                {p.title.split(" — ")[0]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {phases.map((p) => (
                        <TabsContent key={p.title} value={p.title} className="mt-4">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-2xl">{p.title}</CardTitle>
                                    <div className="flex flex-wrap gap-2 text-sm">
                                        <Badge variant="secondary"><Calendar className="h-3.5 w-3.5 mr-1" /> {p.years}</Badge>
                                        <Badge variant="outline">{p.location}</Badge>
                                        <Badge>{p.age} yrs</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {p.sections.map((s) => (
                                        <div key={s.heading} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                {s.icon}
                                                <h4 className="font-semibold">{s.heading}</h4>
                                            </div>
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
                                    <Separator />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        {p.salary && (
                                            <div className="rounded-2xl border p-3">
                                                <p className="text-xs uppercase text-muted-foreground">Salary</p>
                                                <p className="font-medium">{p.salary}</p>
                                            </div>
                                        )}
                                        {p.languages && (
                                            <div className="rounded-2xl border p-3">
                                                <p className="text-xs uppercase text-muted-foreground">Languages</p>
                                                <p className="font-medium">{p.languages}</p>
                                            </div>
                                        )}
                                        {p.lifestyle && (
                                            <div className="rounded-2xl border p-3 sm:col-span-2">
                                                <p className="text-xs uppercase text-muted-foreground">Lifestyle</p>
                                                <p className="font-medium">{p.lifestyle}</p>
                                            </div>
                                        )}
                                        {p.outcome && (
                                            <div className="rounded-2xl border p-3 sm:col-span-2">
                                                <p className="text-xs uppercase text-muted-foreground">Outcome</p>
                                                {Array.isArray(p.outcome) ? (
                                                    <ul className="list-disc pl-6 space-y-1">{p.outcome.map((o) => <li key={o}>{o}</li>)}</ul>
                                                ) : (
                                                    <p className="font-medium">{p.outcome}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </motion.section>

            {/* Summary Timeline */}
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl">Summary Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Phase</TableHead>
                                    <TableHead>Years</TableHead>
                                    <TableHead>Focus</TableHead>
                                    <TableHead>Key Deliverables</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summaryTimeline.map(([phase, years, focus, dels]) => (
                                    <TableRow key={phase}>
                                        <TableCell className="font-medium">{phase}</TableCell>
                                        <TableCell>{years}</TableCell>
                                        <TableCell>{focus}</TableCell>
                                        <TableCell>{dels}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.section>

            {/* Technical & Language Credential Map */}
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <BookOpen className="h-6 w-6" /> Technical & Language Credential Map
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Area</TableHead>
                                    <TableHead>Credential</TableHead>
                                    <TableHead>Level / Provider</TableHead>
                                    <TableHead className="text-right">Target Year</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {credentialMap.map(([area, credential, level, year]) => (
                                    <TableRow key={area + credential}>
                                        <TableCell className="font-medium">{area}</TableCell>
                                        <TableCell>{credential}</TableCell>
                                        <TableCell>{level}</TableCell>
                                        <TableCell className="text-right">{year}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.section>

            {/* Athletic & Lifestyle Integration */}
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Trophy className="h-6 w-6" /> Athletic & Lifestyle Integration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Base</TableHead>
                                    <TableHead>Focus</TableHead>
                                    <TableHead>Events</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lifestyleBlocks.map(([period, base, focus, events]) => (
                                    <TableRow key={period + base}>
                                        <TableCell className="font-medium">{period}</TableCell>
                                        <TableCell>{base}</TableCell>
                                        <TableCell>{focus}</TableCell>
                                        <TableCell>{events}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.section>

            {/* By 2043 */}
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl">✅ By 2043 (~Age 40)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-6 space-y-1">
                            {by2043.map((x) => <li key={x}>{x}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            </motion.section>

            <footer className="text-xs text-muted-foreground">
                This plan is a living document. Review quarterly; update annually.
            </footer>
        </div>
    );
}