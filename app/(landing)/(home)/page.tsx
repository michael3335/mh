"use client";

import Link from "next/link";
import ContactLink from '@shared/components/ContactLink';
import Folder from '@/components/Folder';
import ASCIIText from '@/components/ASCIIText';
import { useSession } from 'next-auth/react';
import UserStatus from '@/components/UserStatus';
import RollerCoaster from '@/components/RollerCoaster';

const AUTH_DESTINATION_FOLDER = "/finder";
const AUTH_DESTINATION_COASTER = "/models";
const RICK = "https://youtu.be/dQw4w9WgXcQ?si=ejrEVACw40p2BpNw";

export default function HomePage() {
    const { status } = useSession(); // 'loading' | 'unauthenticated' | 'authenticated'

    const handleFolderClick = () => {
        if (status === "loading") return;

        if (status === "authenticated") {
            window.location.assign(AUTH_DESTINATION_FOLDER);
        } else {
            window.open(RICK, "noopener,noreferrer");
        }
    };

    const handleCoasterClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        if (status === "loading") return;

        if (status === "authenticated") {
            // handled by <Link> when rendered; this is just for the unauth branch below
            return;
        } else {
            e.preventDefault();
            window.open(RICK, "noopener,noreferrer");
        }
    };

    return (
        <main
            style={{
                minHeight: "100svh",
                width: "100%",
                display: "grid",
                placeItems: "center",
                paddingInline: "clamp(1rem, 4vw, 3rem)",
                paddingBlock: "clamp(2rem, 6vh, 4rem)",
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* Top-right status */}
            <UserStatus />

            {/* Bottom-left folder + coaster */}
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
                    flexDirection: "column",   // vertical stack
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                }}
            >
                {/* Rollercoaster: link to /models if authed; Rickroll otherwise */}
                {status === "authenticated" ? (
                    <Link
                        href={AUTH_DESTINATION_COASTER}
                        aria-label="Open models"
                        className="coasterBtn"
                        prefetch
                    >
                        <RollerCoaster size={28} />
                    </Link>
                ) : (
                    <button
                        type="button"
                        className="coasterBtn"
                        aria-label="Open models (requires sign-in)"
                        onClick={handleCoasterClick}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") handleCoasterClick(e);
                        }}
                        style={{
                            all: "unset",
                            cursor: status === "loading" ? "wait" : "pointer",
                        }}
                    >
                        <RollerCoaster size={28} />
                    </button>
                )}

                {/* Folder: keep original behavior (/finder if authed, Rickroll otherwise) */}
                <button
                    type="button"
                    aria-label="Open folder"
                    className="folderBtn"
                    tabIndex={0}
                    onClick={handleFolderClick}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleFolderClick();
                        }
                    }}
                    style={{
                        all: "unset",
                        cursor: status === "loading" ? "wait" : "pointer",
                    }}
                >
                    <Folder size={0.4} color="#5227FF" />
                </button>
            </div>

            {/* Center hero */}
            <section
                style={{
                    display: "grid",
                    gap: "1.25rem",
                    justifyItems: "center",
                    textAlign: "center",
                    width: "100%",
                }}
            >
                <h1
                    style={{
                        position: "relative",
                        width: "min(92vw, 1000px)",
                        height: "clamp(80px, 22vw, 300px)",
                        margin: 0,
                        lineHeight: 1,
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        userSelect: "none",
                    }}
                >
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                        <ASCIIText text="Michael Harrison" enableWaves interactive={false} />
                    </div>
                </h1>

                <ContactLink />
            </section>

            {/* Local styles to trigger coaster animation when the coaster control is hovered/focused */}
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
        </main>
    );
}