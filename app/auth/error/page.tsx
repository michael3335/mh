// app/auth/error/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Sign in",
    robots: { index: false, follow: false },
};

export default function AuthErrorPage() {
    return (
        <main
            style={{
                minHeight: "100svh",
                display: "grid",
                placeItems: "center",
                paddingInline: "clamp(16px, 4vw, 32px)",
                paddingBlock: "clamp(32px, 8vh, 64px)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontFamily: 'var(--font-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 520,
                    border: `1px solid var(--border)`,
                    borderRadius: "16px",
                    padding: "var(--space-6)",
                    background: "var(--card)",
                    boxShadow: "0 16px 48px rgba(15, 23, 42, 0.08)",
                    display: "grid",
                    gap: "var(--space-5)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: "var(--accent-soft)",
                            display: "grid",
                            placeItems: "center",
                            color: "var(--accent)",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        MH
                    </div>
                    <div>
                        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Private access</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>Michael Harrison</div>
                    </div>
                </div>

                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "clamp(22px, 3vw, 28px)",
                            letterSpacing: "-0.02em",
                            fontFamily: "var(--font-heading), var(--font-sans)",
                        }}
                    >
                        Sign in to continue
                    </h1>
                    <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        This workspace is private. Please authenticate with GitHub to proceed.
                    </p>
                </div>

                <Link
                    href="/api/auth/signin"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: `1px solid var(--accent)`,
                        background: "var(--accent)",
                        color: "#ffffff",
                        fontWeight: 600,
                        textDecoration: "none",
                        boxShadow: "0 10px 30px rgba(5, 150, 105, 0.18)",
                        transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
                    }}
                >
                    <GitHubMark />
                    <span>Sign in with GitHub</span>
                </Link>

                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
                    Need access? Contact Michael for an invite.
                </p>
            </div>
        </main>
    );
}

function GitHubMark() {
    return (
        <Image
            src="https://github.githubassets.com/favicons/favicon.svg"
            alt=""
            width={20}
            height={20}
            style={{ filter: "invert(1)" }}
        />
    );
}
