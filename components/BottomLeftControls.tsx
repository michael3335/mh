// components/BottomLeftControls.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import RollerCoaster from "@/components/RollerCoaster";
import Folder from "@/components/Folder";

const AUTH_DESTINATION_FOLDER = "/finder";
const AUTH_DESTINATION_COASTER = "/models";
const RICK = "https://youtu.be/dQw4w9WgXcQ?si=ejrEVACw40p2BpNw";

// Optional: hide on certain routes
const HIDE_ON = new Set<string>([
    // "/models", // uncomment to hide here
]);

export default function BottomLeftControls() {
    const { status } = useSession(); // 'loading' | 'unauthenticated' | 'authenticated'
    const pathname = usePathname();
    if (HIDE_ON.has(pathname)) return null;

    const handleFolderClick = () => {
        if (status === "loading") return;
        if (status === "authenticated") {
            window.location.assign(AUTH_DESTINATION_FOLDER);
        } else {
            window.open(RICK, "noopener,noreferrer");
        }
    };

    const handleCoasterUnauthed = (e: React.MouseEvent | React.KeyboardEvent) => {
        if (status === "loading") return;
        e.preventDefault();
        window.open(RICK, "noopener,noreferrer");
    };

    return (
        <div
            className="folderWrap"
            style={{
                position: "fixed",
                left: "clamp(4px, 1vw, 12px)",
                bottom: "clamp(4px, 1vw, 12px)",
                zIndex: 10,
                pointerEvents: "auto",
                touchAction: "manipulation",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
            }}
        >
            {/* Coaster goes to /models when authed; Rick otherwise */}
            {status === "authenticated" ? (
                <Link href={AUTH_DESTINATION_COASTER} aria-label="Open models" className="coasterBtn" prefetch>
                    <RollerCoaster size={28} />
                </Link>
            ) : (
                <button
                    type="button"
                    className="coasterBtn"
                    aria-label="Open models (sign in required)"
                    onClick={handleCoasterUnauthed}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleCoasterUnauthed(e);
                    }}
                    style={{ all: "unset", cursor: status === "loading" ? "wait" : "pointer" }}
                >
                    <RollerCoaster size={28} />
                </button>
            )}

            {/* Folder keeps your original /finder-or-rick behavior */}
            <button
                type="button"
                aria-label="Open folder"
                className="folderBtn"
                onClick={handleFolderClick}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleFolderClick();
                    }
                }}
                style={{ all: "unset", cursor: status === "loading" ? "wait" : "pointer" }}
            >
                <Folder size={0.4} color="#5227FF" />
            </button>

            <style jsx>{`
        .coasterBtn:hover :global(.coaster-anim),
        .coasterBtn:focus-visible :global(.coaster-anim) {
          animation: rc-wiggle 900ms ease-in-out both, rc-bob 1200ms ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .coasterBtn:hover :global(.coaster-anim),
          .coasterBtn:focus-visible :global(.coaster-anim) {
            animation: none !important;
            transform: translateY(-2px);
          }
        }
      `}</style>
        </div>
    );
}