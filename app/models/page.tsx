// app/models/page.tsx
"use client";

import ASCIIText from "@/components/ASCIIText";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { Route } from "next";

export default function ModelsPage() {
    const { status } = useSession(); // 'loading' | 'unauthenticated' | 'authenticated'

    const routes = {
        home: "/" as Route,
        signin: "/api/auth/signin" as Route,
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
        <main
            style={{
                minHeight: "100svh",
                width: "100%",
                display: "grid",
                placeItems: "center",
                padding: "2rem",
                textAlign: "center",
                background: "#111213",
                color: "#f4f4f5",
            }}
        >
            <section style={{ display: "grid", gap: "1.5rem" }}>
                <div
                    style={{
                        width: "min(90vw, 700px)",
                        position: "relative",
                        height: "clamp(80px, 20vw, 200px)",
                        margin: "0 auto",
                    }}
                >
                    <ASCIIText text="Models" enableWaves interactive={false} />
                </div>

                {status === "loading" && <p>Checking access…</p>}

                {status === "unauthenticated" && (
                    <>
                        <p>You must sign in to view models.</p>
                        <Link href={routes.signin} style={{ ...buttonStyle }}>Sign In</Link>
                    </>
                )}

                {status === "authenticated" && (
                    <div style={{ display: "grid", gap: "0.8rem", justifyItems: "center" }}>
                        <Link href={routes.strategiesSeed} style={buttonStyle}>📊 Strategies</Link>
                        <Link href={routes.runs} style={buttonStyle}>🚀 Runs</Link>
                        <Link href={routes.bots} style={buttonStyle}>🤖 Bots</Link>
                    </div>
                )}

                <Link
                    href={routes.home}
                    style={{
                        marginTop: "1rem",
                        opacity: 0.85,
                        textDecoration: "none",
                        color: "#e5e7eb",
                    }}
                >
                    ← Back to home
                </Link>
            </section>
        </main>
    );
}