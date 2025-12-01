import { Suspense } from "react";
import SignInForm from "@/components/SignInForm";

export default function SignInPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center px-6 py-12">
                    <p className="text-sm text-zinc-500">Loading sign-in form…</p>
                </main>
            }
        >
            <SignInForm />
        </Suspense>
    );
}
