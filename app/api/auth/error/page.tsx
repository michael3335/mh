// app/auth/error/page.tsx
"use client";

import { signIn } from "next-auth/react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Access denied",
    robots: { index: false, follow: false }, // don't index this page
};

const HOME = "/";

type SearchParams =
    | { [key: string]: string | string[] | undefined }
    | undefined;

function getErrorMessage(errorParam: string | string[] | undefined) {
    const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

    switch (error) {
        case "AccessDenied":
            return "This site is restricted to a single authorised GitHub account.";
        case "OAuthAccountNotLinked":
            return "This GitHub account is not linked to an authorised user.";
        case "Configuration":
            return "Auth is misconfigured. Please try again later.";
        case "Callback":
            return "There was a problem completing sign in.";
        case "Default":
        case undefined:
        default:
            return `Sign-in failed${error ? `: ${error}` : ""}.`;
    }
}

export default function AuthErrorPage({
    searchParams,
}: {
    searchParams?: SearchParams;
}) {
    const message = getErrorMessage(searchParams?.error);

    return (
        <main
            style={{
                minHeight: "100svh",
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                padding: 24,
            }}
        >
            <div
                style={{
                    maxWidth: 560,
                    width: "100%",
                    display: "grid",
                    gap: 12,
                }}
            >
                <h1 style={{ margin: 0, fontSize: "1.5rem", lineHeight: 1.2 }}>
                    Access denied
                </h1>

                <p style={{ opacity: 0.8, margin: 0 }}>{message}</p>

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        justifyContent: "center",
                        marginTop: 8,
                    }}
                >
                    <button
                        onClick={() => signIn(undefined, { callbackUrl: HOME })}
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
                        Authorise
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
            </div>
        </main>
    );
}