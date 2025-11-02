"use client";

import React from "react";

type RollerCoasterProps = {
    /** Font-size in px (or number -> px). Defaults to 26. */
    size?: number | string;
    /** Optional className to target from parent (kept for styled-jsx :global). */
    className?: string;
    /** Tooltip text */
    title?: string;
};

export default function RollerCoaster({
    size = 26,
    className = "",
    title = "weee!",
}: RollerCoasterProps) {
    const fontSize = typeof size === "number" ? `${size}px` : size;

    return (
        <span
            className={`coaster coaster-anim ${className}`.trim()}
            aria-hidden="true"
            title={title}
            style={{
                fontSize,
                lineHeight: 1,
                display: "inline-block",
                transformOrigin: "60% 70%",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,.35))",
            }}
        >
            {/* Using emoji for maximum vibe; swap to an SVG later if desired */}
            🎢
            <style jsx>{`
        /* Base, idle state (no animation by default) */
        .coaster {
          transform: translateY(0) rotate(0deg);
          transition: transform 200ms ease;
        }

        /* These keyframes are defined here so a parent can trigger them via class targeting */
        @keyframes rc-wiggle {
          0%   { transform: translateY(-2px) rotate(-6deg); }
          25%  { transform: translateY(-1px) rotate(3deg); }
          50%  { transform: translateY(-3px) rotate(-4deg); }
          75%  { transform: translateY(-1px) rotate(2deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes rc-bob {
          0%   { transform: translateY(0) rotate(0deg); }
          50%  { transform: translateY(-3px) rotate(-1deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }

        /* Respect reduced motion at component level, too */
        @media (prefers-reduced-motion: reduce) {
          .coaster {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
        </span>
    );
}