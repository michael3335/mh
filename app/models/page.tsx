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
        padding: "0.8rem 1.5rem",
        borderRadius: 10,
        fontWeight: 800,
        textDecoration: "none",
        width: "min(260px, 70vw)",
        background: "#fff",
        color: "#111",
        border: "1px solid rgba(255,255,255,.2)",
        boxShadow: "0 2px 10px rgba(0,0,0,.18)",
    };

    return (
        <DashboardShell title="Models" unauthenticatedMessage="You must sign in to view models.">
            <div style={{ display: "grid", gap: "0.8rem", justifyItems: "center" }}>
                <Link href={routes.strategiesSeed} style={buttonStyle}>📊 Strategies</Link>
                <Link href={routes.runs} style={buttonStyle}>🚀 Runs</Link>
                <Link href={routes.bots} style={buttonStyle}>🤖 Bots</Link>
            </div>
        </DashboardShell>
    );
}
