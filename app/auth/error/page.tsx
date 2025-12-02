// app/auth/error/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Sign in",
    robots: { index: false, follow: false },
};

type AuthErrorPageProps = {
    searchParams?: Record<string, string | string[] | undefined>;
};

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
    // Optional: only redirect if there *is* an error param
    const error =
        typeof searchParams?.error === "string" ? searchParams.error : undefined;

    // You can add conditional logic here if you ever need it:
    // if (error === "AccessDenied") redirect("https://michaelharrison.au");

    redirect("https://michaelharrison.au");
}