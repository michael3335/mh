// app/auth/error/AuthActions.tsx
"use client";

import { signIn } from "next-auth/react";

const HOME = "/";

export default function AuthActions() {
    return (
        <div
            style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginTop: 8,
            }}
        >
            <button
                onClick={() => signIn("github", { callbackUrl: HOME })}
                style={{
                    border: "1px solid currentColor",
                    borderRadius: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    background: "transparent",
                }}
                aria-label="Authorise with GitHub"
                title="Authorise with GitHub"
            >
                Authorise with GitHub
            </button>

            <a
                href={HOME}
                style={{
                    display: "inline-block",
                    border: "1px solid currentColor",
                    borderRadius: 8,
                    padding: "8px 12px",
                    textDecoration: "none",
                }}
            >
                Go back home
            </a>
        </div>
    );
}