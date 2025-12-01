"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center px-6 py-12">
            <div className="max-w-md w-full bg-white/80 backdrop-blur border border-zinc-200 rounded-2xl shadow-sm p-8 space-y-6">
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                        Access
                    </p>
                    <h1 className="text-3xl font-semibold font-display">Michael Harrison - Private</h1>
                    <p className="text-zinc-600">
                        Private workspace. Sign in with the approved GitHub account to
                        continue.
                    </p>
                </div>

                <button
                    onClick={() => signIn("github", { callbackUrl })}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white px-4 py-3 text-sm font-medium hover:bg-zinc-800 transition"
                >
                    Continue with GitHub
                </button>

                <p className="text-xs text-zinc-500 text-center">
                    Access limited to a single GitHub user.
                </p>
            </div>
        </main>
    );
}
