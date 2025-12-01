// app/models/page.tsx
"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import Link from "next/link";
import type { Route } from "next";

export default function ModelsPage() {
    const routes = {
        strategiesSeed: "/models/strategies/seed" as Route,
        runs: "/models/runs" as Route,
        bots: "/models/bots" as Route,
    };

    const buttonStyle: React.CSSProperties = {
        padding: "0.6rem 1.2rem",
        borderRadius: 999,
        fontWeight: 500,
        textDecoration: "none",
        width: "min(260px, 70vw)",
        background: "transparent",
        color: "var(--text-secondary)",
        border: "var(--hairline) solid var(--rule)",
    };

    return (
        <DashboardShell title="Models" unauthenticatedMessage="You must sign in to view models.">
            <div style={{ display: "grid", gap: "0.6rem", justifyItems: "flex-start" }}>
                <Link href={routes.strategiesSeed} style={buttonStyle}>📊 Strategies</Link>
                <Link href={routes.runs} style={buttonStyle}>🚀 Runs</Link>
                <Link href={routes.bots} style={buttonStyle}>🤖 Bots</Link>
            </div>
        </DashboardShell>
    );
}
