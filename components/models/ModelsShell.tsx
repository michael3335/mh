"use client";

import ASCIIText from "@/components/ASCIIText";
import Link from "next/link";
import type { Route } from "next";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { SessionStatus } from "next-auth";

type ToastTone = "info" | "success" | "error";

type Toast = {
    id: number;
    message: string;
    tone: ToastTone;
};

type ToastPayload = {
    message: string;
    tone?: ToastTone;
};

type FooterLink = {
    label: string;
    href: Route;
};

type ModelsShellProps = {
    title: string;
    children: React.ReactNode;
    unauthenticatedMessage?: string;
    footerLinks?: FooterLink[];
};

type ModelsContextValue = {
    status: SessionStatus;
    notify: (toast: ToastPayload) => void;
};

const ModelsContext = createContext<ModelsContextValue | null>(null);

export function useModelsContext() {
    const ctx = useContext(ModelsContext);
    if (!ctx) {
        throw new Error("useModelsContext must be used inside ModelsShell");
    }
    return ctx;
}

export default function ModelsShell({
    title,
    children,
    unauthenticatedMessage = "You must sign in to access this area.",
    footerLinks,
}: ModelsShellProps) {
    const { status } = useSession();
    const [toast, setToast] = useState<Toast | null>(null);

    const notify = useCallback(({ message, tone = "info" }: ToastPayload) => {
        setToast({ id: Date.now(), message, tone });
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 3500);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const links = useMemo<FooterLink[]>(() => {
        if (footerLinks && footerLinks.length) {
            return footerLinks;
        }
        return [{ label: "← Back to home", href: "/" as Route }];
    }, [footerLinks]);

    const badgeColors: Record<ToastTone, string> = {
        info: "rgba(59,130,246,.2)",
        success: "rgba(34,197,94,.25)",
        error: "rgba(239,68,68,.25)",
    };

    return (
        <ModelsContext.Provider value={{ status, notify }}>
            <main
                style={{
                    minHeight: "100svh",
                    width: "100%",
                    display: "grid",
                    placeItems: "center",
                    padding: "2rem",
                    textAlign: "center",
                    background: "#111213",
                    color: "#f4f4f5",
                }}
            >
                <section style={{ display: "grid", gap: "1.5rem", width: "min(100%, 1080px)" }}>
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

                    {links.length > 0 && (
                        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6 }}>
                            {links.map((link) => (
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

                {toast && (
                    <div
                        style={{
                            position: "fixed",
                            top: 24,
                            right: 24,
                            zIndex: 20,
                            background: badgeColors[toast.tone],
                            border: "1px solid rgba(255,255,255,.25)",
                            borderRadius: 12,
                            padding: "0.75rem 1rem",
                            color: "#fff",
                            fontWeight: 700,
                            boxShadow: "0 10px 35px rgba(0,0,0,.4)",
                            maxWidth: 320,
                            textAlign: "left",
                        }}
                    >
                        {toast.message}
                    </div>
                )}
            </main>
        </ModelsContext.Provider>
    );
}
