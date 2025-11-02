"use client";

import React, { useId } from "react";

type Props = {
    size?: number;
    title?: string;
};

export default function GoldNugget({ size = 40, title = "Gold & Pickaxe" }: Props) {
    const uid = useId();
    const idFilter = `gp-filter-${uid}`;
    const idGoldTop = `gp-gold-top-${uid}`;
    const idGoldMid = `gp-gold-mid-${uid}`;
    const idGoldShadow = `gp-gold-shadow-${uid}`;
    const idGoldHighlight = `gp-gold-highlight-${uid}`;

    return (
        <>
            <svg
                width={size}
                height={size}
                viewBox="0 0 32 32"
                aria-hidden={!title}
                role={title ? "img" : "presentation"}
                xmlns="http://www.w3.org/2000/svg"
                className="gold-nugget-anim"
                style={{ display: "block" }}
            >
                {title && <title>{title}</title>}

                <defs>
                    <filter id={idFilter} x="-25%" y="-25%" width="150%" height="170%">
                        <feDropShadow dx="0" dy="0.6" stdDeviation="0.9" floodOpacity="0.22" />
                    </filter>

                    <linearGradient id={idGoldTop} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFF8C8" />
                        <stop offset="100%" stopColor="#FFD54A" />
                    </linearGradient>
                    <linearGradient id={idGoldMid} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F5C63A" />
                        <stop offset="100%" stopColor="#E1B133" />
                    </linearGradient>
                    <linearGradient id={idGoldShadow} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C2962A" />
                        <stop offset="100%" stopColor="#9B7A1F" />
                    </linearGradient>
                    <linearGradient id={idGoldHighlight} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#FFF6B8" stopOpacity="0.25" />
                    </linearGradient>
                </defs>

                {/* Centered group for main artwork */}
                <g transform="translate(2 1) scale(1.25)" filter={`url(#${idFilter})`}>
                    {/* Pickaxe (animated) */}
                    <g className="gp-pickaxe">
                        <path d="M7 7 h14 v2 h-4 v3 h-6 v-3 h-4z" fill="#898989" />
                        <rect x="13" y="10" width="2" height="11" rx="1" fill="#5C3A15" />
                        <rect x="13" y="10" width="2" height="4" rx="1" fill="#8A5A22" />
                    </g>

                    {/* Nugget */}
                    <g>
                        <path d="M17 16 h7 v4 h-7z" fill={`url(#${idGoldMid})`} />
                        <path d="M18 15 h5 v2 h-5z" fill={`url(#${idGoldTop})`} />
                        <path d="M16 20 h7 v2 h-7z" fill={`url(#${idGoldShadow})`} />
                        <rect x="19" y="16" width="3" height="1" fill={`url(#${idGoldHighlight})`} opacity="0.9" />
                    </g>

                    {/* Impact flash */}
                    <g className="gp-impact" transform="translate(21 16)">
                        <circle r="0.8" fill="#FFFFFF" />
                    </g>

                    {/* Debris (lifted higher for centering) */}
                    <g className="gp-debris gp-debris-1" transform="translate(20 17)">
                        <rect x="-1" y="-1" width="2" height="2" fill="#FFD54A" />
                    </g>
                    <g className="gp-debris gp-debris-2" transform="translate(22 16)">
                        <rect x="-0.8" y="-0.8" width="1.6" height="1.6" fill="#E1B133" />
                    </g>
                    <g className="gp-debris gp-debris-3" transform="translate(19 16)">
                        <rect x="-0.9" y="-0.9" width="1.8" height="1.8" fill="#C2962A" />
                    </g>
                </g>

                {/* Sparkles (not counted for centering) */}
                <g className="gold-sparkle" transform="translate(26 12) rotate(45)" pointerEvents="none">
                    <rect x="-1" y="-3" width="2" height="6" fill="#FFFFFF" />
                    <rect x="-3" y="-1" width="6" height="2" fill="#FFFFFF" />
                </g>
                <g
                    className="gold-sparkle"
                    transform="translate(17 13) rotate(45)"
                    style={{ animationDelay: "1.25s" }}
                    pointerEvents="none"
                >
                    <rect x="-0.7" y="-2" width="1.4" height="4" fill="#FFFFFF" opacity="0.85" />
                    <rect x="-2" y="-0.7" width="4" height="1.4" fill="#FFFFFF" opacity="0.85" />
                </g>
            </svg>

            <style jsx>{`
        .gold-sparkle {
          transform-box: fill-box;
          transform-origin: 50% 50%;
          animation: gn-twinkle 4s ease-in-out infinite;
          opacity: 0;
        }
        @keyframes gn-twinkle {
          0% { opacity: 0; transform: scale(0.7) rotate(0deg); }
          10% { opacity: 1; transform: scale(1) rotate(10deg); }
          20% { opacity: 0; transform: scale(0.7) rotate(0deg); }
          100% { opacity: 0; transform: scale(0.7) rotate(0deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .gold-sparkle { animation: none; opacity: 0.9; }
        }
      `}</style>
        </>
    );
}