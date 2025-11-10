"use client";

import ASCIIText from "@/components/ASCIIText";
import Link from "next/link";
import type { Route } from "next";
import type { CSSProperties } from "react";
import { DashboardProvider, useDashboard } from "@/components/dashboard/DashboardProvider";

type FooterLink = {
    label: string;
    href: Route;
};

type DashboardShellProps = {
    title: string;
    children: React.ReactNode;
    unauthenticatedMessage?: string;
    footerLinks?: FooterLink[] | null;
    hero?: React.ReactNode | null;
    mainStyle?: CSSProperties;
    sectionStyle?: CSSProperties;
};

export default function DashboardShell(props: DashboardShellProps) {
    return (
        <DashboardProvider>
            <DashboardLayout {...props} />
        </DashboardProvider>
    );
}

function DashboardLayout({
    title,
    children,
    unauthenticatedMessage = "You must sign in to access this area.",
    footerLinks,
    hero,
    mainStyle,
    sectionStyle,
}: DashboardShellProps) {
    const { status } = useDashboard();

    const baseMainStyle: CSSProperties = {
        minHeight: "100svh",
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        textAlign: "center",
        background: "#111213",
        color: "#f4f4f5",
    };

    const baseSectionStyle: CSSProperties = {
        display: "grid",
        gap: "1.5rem",
        width: "min(100%, 1080px)",
    };

    const resolvedHero =
        hero === null
            ? null
            : hero ?? (
                <div
                    style={{
                        width: "min(90vw, 720px)",
                        height: "clamp(80px, 20vw, 200px)",
                        position: "relative",
                        margin: "0 auto",
                    }}
                >
                    <ASCIIText text={title} enableWaves={false} interactive={false} />
                </div>
            );

    let resolvedLinks: FooterLink[] = [];
    if (footerLinks === undefined) {
        resolvedLinks = [{ label: "← Back to home", href: "/" as Route }];
    } else if (footerLinks) {
        resolvedLinks = footerLinks;
    }

    return (
        <main style={{ ...baseMainStyle, ...mainStyle }}>
            <section style={{ ...baseSectionStyle, ...sectionStyle }}>
                {resolvedHero}

                {status === "loading" && <p>Checking access…</p>}

                {status === "unauthenticated" && (
                    <>
                        <p>{unauthenticatedMessage}</p>
                        <Link
                            href={"/api/auth/signin" as Route}
                            style={{
                                padding: "0.7rem 1.2rem",
                                borderRadius: 10,
                                fontWeight: 800,
                                textDecoration: "none",
                                background: "#fff",
                                color: "#111",
                                boxShadow: "0 2px 10px rgba(0,0,0,.18)",
                            }}
                        >
                            Sign In
                        </Link>
                    </>
                )}

                {status === "authenticated" && children}

                {resolvedLinks.length > 0 && (
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6 }}>
                        {resolvedLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{ opacity: 0.9, textDecoration: "none", color: "#e5e7eb" }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
