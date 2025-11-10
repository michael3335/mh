"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type ToastTone = "info" | "success" | "error";

type Toast = {
    id: number;
    message: string;
    tone: ToastTone;
};

export type ToastPayload = {
    message: string;
    tone?: ToastTone;
};

type DashboardContextValue = {
    status: SessionStatus;
    notify: (toast: ToastPayload) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) {
        throw new Error("useDashboard must be used inside DashboardProvider");
    }
    return ctx;
}

type DashboardProviderProps = {
    children: React.ReactNode;
    toastPosition?: { top?: number; right?: number };
};

export function DashboardProvider({ children, toastPosition }: DashboardProviderProps) {
    const { status } = useSession();
    const [toast, setToast] = useState<Toast | null>(null);

    const notify = useCallback(({ message, tone = "info" }: ToastPayload) => {
        setToast({ id: Date.now(), message, tone });
    }, []);

    const value = useMemo(() => ({ status, notify }), [status, notify]);

    const badgeColors: Record<ToastTone, string> = {
        info: "rgba(59,130,246,.2)",
        success: "rgba(34,197,94,.25)",
        error: "rgba(239,68,68,.25)",
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: toastPosition?.top ?? 24,
                        right: toastPosition?.right ?? 24,
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
        </DashboardContext.Provider>
    );
}
