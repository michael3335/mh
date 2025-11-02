"use client";

import { useSession, signOut } from "next-auth/react";

export default function UserStatus() {
    const { data: session, status } = useSession();

    if (status === "loading") return null; // avoid flicker

    if (status === "authenticated") {
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
                    background: "rgba(0,0,0,0.2)",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "8px",
                    backdropFilter: "blur(6px)",
                }}
            >
                <span>Hello, {session.user?.name?.split(" ")[0] ?? "User"} 👋</span>

                {/* mini sign-out */}
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    style={{
                        fontSize: "0.75rem",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        opacity: 0.8,
                    }}
                    aria-label="Sign out"
                    title="Sign out"
                >
                    ✕
                </button>
            </div>
        );
    }

    return null;
}