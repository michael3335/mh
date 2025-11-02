// app/auth/error/page.tsx
import type { Metadata } from "next";
import AuthActions from "./AuthActions";

export const metadata: Metadata = {
    title: "Access denied",
    robots: { index: false, follow: false },
};

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
            <div style={{ maxWidth: 560, width: "100%", display: "grid", gap: 12 }}>
                <h1 style={{ margin: 0, fontSize: "1.5rem", lineHeight: 1.2 }}>
                    Access denied
                </h1>

                <p style={{ opacity: 0.8, margin: 0 }}>{message}</p>
            </div>
        </main>
    );
}