"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInForm() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center px-6 py-12">
            <div className="max-w-md w-full bg-white/80 backdrop-blur border border-zinc-200 rounded-2xl shadow-sm p-8 space-y-6">
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Access</p>
                    <h1 className="text-3xl font-semibold font-display">Private workspace</h1>
                </div>

                {/* Single primary-style button (white bg, black text) */}
                <a
                    href="https://michaelharrison.au"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white text-zinc-900 px-4 py-3 text-sm font-medium hover:bg-zinc-50 transition"
                >
                    Visit michaelharrison.au
                </a>

                {/* Simple text link for login using <Link> */}
                <div className="text-xs text-zinc-500 text-center">
                    <Link
                        href="#"
                        onClick={(event) => {
                            event.preventDefault();
                            signIn("github", { callbackUrl });
                        }}
                        className="inline-flex items-center justify-center gap-1 underline underline-offset-4 hover:text-zinc-700 cursor-pointer"
                    >
                        <span>continue to log in</span>
                        <span
                            aria-hidden="true"
                            className="text-[0.7rem] text-zinc-400 relative top-[-1px]"
                        >
                            →
                        </span>
                    </Link>
                </div>

                <p className="text-[11px] text-zinc-400 text-center">
                    Access to this workspace is limited to a single GitHub user.
                </p>
            </div>
        </main>
    );
}