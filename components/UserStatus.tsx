"use client";

import { useSession, signIn } from "next-auth/react";

const HOME = "/"; // ✅ redirect here after successful sign in

export default function UserStatus() {
    const { data: session, status } = useSession();

    if (status === "loading") return null;

    return (
        <div
            style={{
                position: "fixed",
                top: "1rem",
                right: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                padding: "0.4rem 0.75rem",
                backdropFilter: "blur(6px)",
            }}
        >
            {status === "authenticated" ? (
                <span>Hello, {session.user?.name?.split(" ")[0] ?? "there"} 👋</span>
            ) : (
                <button
                    onClick={() => signIn(undefined, { callbackUrl: HOME })} // ✅ updated
                    style={{
                        fontSize: "0.875rem",
                        background: "transparent",
                        padding: "0.25rem 0.5rem",
                        cursor: "pointer",
                    }}
                    aria-label="Sign in"
                    title="Authorise"
                >
                    Authorise
                </button>
            )}
        </div>
    );
}