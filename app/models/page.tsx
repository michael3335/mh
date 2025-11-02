// app/models/page.tsx
"use client";

import ASCIIText from "@/components/ASCIIText";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ModelsPage() {
    const { status } = useSession(); // 'loading' | 'unauthenticated' | 'authenticated'

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
                    <ASCIIText
                        text="Models"
                        enableWaves
                        interactive={false}
                    />
                </div>

                {status === "loading" && <p>Checking access…</p>}

                {status === "unauthenticated" && (
                    <>
                        <p>You must sign in to view models.</p>
                        <Link
                            href="/api/auth/signin"
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
                    <p>🚧 Model viewer coming soon…</p>
                )}

                <Link
                    href="/"
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