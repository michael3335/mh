// app/models/page.tsx
"use client";

import ASCIIText from "@/components/ASCIIText";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { Route } from "next";

export default function ModelsPage() {
    const { status } = useSession(); // 'loading' | 'unauthenticated' | 'authenticated'

    // Strongly-typed routes (satisfy Link's RouteImpl requirement)
    const routes = {
        strategies: "/models/strategies/seed" as Route,
        runs: "/models/runs" as Route,
        bots: "/models/bots" as Route,
        home: "/" as Route,
        signin: "/api/auth/signin" as Route,
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
            }}
        >
            <section style={{ display: "grid", gap: "1.5rem" }}>
                <div
                    style={{
                        width: "min(90vw, 700px)",
                        position: "relative",
                        height: "clamp(80px, 20vw, 200px)",
                    }}
                >
                    <ASCIIText text="Models" enableWaves interactive={false} />
                </div>

                {status === "loading" && <p>Checking access…</p>}

                {status === "unauthenticated" && (
                    <>
                        <p>You must sign in to view models.</p>
                        <Link
                            href={routes.signin}
                            style={{
                                padding: "0.6rem 1.2rem",
                                borderRadius: "6px",
                                fontWeight: 600,
                                border: "2px solid currentColor",
                                textDecoration: "none",
                            }}
                        >
                            Sign In
                        </Link>
                    </>
                )}

                {status === "authenticated" && (
                    <div style={{ display: "grid", gap: "1rem", justifyItems: "center" }}>
                        <Link
                            href={routes.strategies}
                            style={{
                                padding: "0.8rem 1.5rem",
                                borderRadius: "6px",
                                border: "2px solid currentColor",
                                fontWeight: 600,
                                textDecoration: "none",
                                width: "min(240px, 70vw)",
                            }}
                        >
                            📊 Strategies
                        </Link>

                        <Link
                            href={routes.runs}
                            style={{
                                padding: "0.8rem 1.5rem",
                                borderRadius: "6px",
                                border: "2px solid currentColor",
                                fontWeight: 600,
                                textDecoration: "none",
                                width: "min(240px, 70vw)",
                            }}
                        >
                            🚀 Runs
                        </Link>

                        <Link
                            href={routes.bots}
                            style={{
                                padding: "0.8rem 1.5rem",
                                borderRadius: "6px",
                                border: "2px solid currentColor",
                                fontWeight: 600,
                                textDecoration: "none",
                                width: "min(240px, 70vw)",
                            }}
                        >
                            🤖 Bots
                        </Link>
                    </div>
                )}

                <Link
                    href={routes.home}
                    style={{
                        marginTop: "1rem",
                        opacity: 0.7,
                        textDecoration: "none",
                    }}
                >
                    ← Back to home
                </Link>
            </section>
        </main>
    );
}