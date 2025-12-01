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
        background: "var(--background)",
        color: "var(--foreground)",
        padding: "32px 20px 72px",
    };

    const baseSectionStyle: CSSProperties = {
        display: "grid",
        gap: "1.5rem",
        width: "min(720px, 100%)",
        margin: "0 auto",
        textAlign: "left",
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
                        <p style={{ margin: 0, color: "var(--text-secondary)" }}>{unauthenticatedMessage}</p>
                        <Link
                            href={"/api/auth/signin" as Route}
                            style={{
                                fontSize: "0.75rem",
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                textDecoration: "none",
                                color: "var(--text-secondary)",
                            }}
                        >
                            Sign in<span aria-hidden> ↗</span>
                        </Link>
                    </>
                )}

                {status === "authenticated" && children}

                {resolvedLinks.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            justifyContent: "flex-start",
                            marginTop: 6,
                            fontSize: "0.75rem",
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "var(--text-muted)",
                        }}
                    >
                        {resolvedLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{ opacity: 0.9, textDecoration: "none", color: "inherit" }}
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
