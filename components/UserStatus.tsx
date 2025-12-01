"use client";

import { useSession, signIn } from "next-auth/react";

const CALLBACK = "/";

export default function UserStatus() {
    const { data: session, status } = useSession();

    if (status === "loading") return null;

    return (
        <div
            style={{
                position: "fixed",
                top: "1.5rem",
                right: "1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "0.25rem",
                fontSize: "0.75rem",
                lineHeight: 1.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                pointerEvents: "none",
            }}
        >
            {status === "authenticated" ? (
                <span
                    style={{
                        fontSize: "0.7rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                    }}
                >
                    {`Signed in as ${session.user?.name?.split(" ")[0] ?? "guest"
                        }`}
                </span>
            ) : (
                <button
                    onClick={() => signIn("github", { callbackUrl: CALLBACK })}
                    style={{
                        pointerEvents: "auto",
                        marginTop: "0.1rem",
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        fontSize: "0.7rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                    }}
                    aria-label="Sign in with GitHub"
                    title="Private access · sign in"
                >
                    Private access · Sign in
                </button>
            )}
            {status === "authenticated" ? (
                <a
                    href="https://www.michaelharrison.au"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        pointerEvents: "auto",
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                    }}
                >
                    michaelharrison.au
                </a>
            ) : null}
        </div>
    );
}
