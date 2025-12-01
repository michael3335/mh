// components/BottomLeftControls.tsx
"use client";

import Link from "next/link";
import type { Route } from "next";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import RollerCoaster from "@/components/RollerCoaster";
import Folder from "@/components/Folder";
import GoldNugget from "@/components/GoldNugget";

const AUTH_DESTINATION_FOLDER = "/finder";
const AUTH_DESTINATION_COASTER: Route = "/models";
const AUTH_DESTINATION_PICKAXE: Route = "/commodities"; // keeping constant name for minimal diff
const AUTH_DESTINATION_NOTE: Route = "/notes"; // <— sticky note destination
const AUTH_DESTINATION_FUTURE: Route = "/future";
const AUTH_DESTINATION_ENERGY: Route = "/commodities"; // energy & commodities hub (same as commodities lab)
const AUTH_DESTINATION_NEWS: Route = "/news"; // NEW: news briefing
const AUTH_DESTINATION_INSIGHTS: Route = "/insights"; // NEW: portfolio blog
const RICK = "https://youtu.be/dQw4w9WgXcQ?si=ejrEVACw40p2BpNw";

// Optional: hide on certain routes
const HIDE_ON = new Set<string>([
  // "/models",
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

  const handleUnauthedRick = (e: React.MouseEvent | React.KeyboardEvent) => {
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
        gap: "12px",
      }}
    >
      {/* Crystal Ball — /future if authed; Rick otherwise */}
      {status === "authenticated" ? (
        <Link
          href={AUTH_DESTINATION_FUTURE}
          aria-label="Open future plan"
          className="futureBtn iconBox"
          prefetch
        >
          <span aria-hidden className="futureIcon" style={{ fontSize: 28, lineHeight: 1 }}>
            🔮
          </span>
        </Link>
      ) : (
        <button
          type="button"
          className="futureBtn iconBox"
          aria-label="Open future plan (sign in required)"
          onClick={handleUnauthedRick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleUnauthedRick(e);
          }}
        >
          <span aria-hidden className="futureIcon" style={{ fontSize: 28, lineHeight: 1 }}>
            🔮
          </span>
        </button>
      )}

      {/* NEW: News — /news if authed; Rick otherwise */}
      {status === "authenticated" ? (
        <Link
          href={AUTH_DESTINATION_NEWS}
          aria-label="Open news briefing"
          className="newsBtn iconBox"
          prefetch
        >
          <span aria-hidden className="newsIcon" style={{ fontSize: 28, lineHeight: 1 }}>
            📰
          </span>
        </Link>
      ) : (
        <button
          type="button"
          className="newsBtn iconBox"
          aria-label="Open news briefing (sign in required)"
          onClick={handleUnauthedRick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleUnauthedRick(e);
          }}
        >
          <span aria-hidden className="newsIcon" style={{ fontSize: 28, lineHeight: 1 }}>
            📰
          </span>
        </button>
      )}

      {/* Energy — /energy if authed; Rick otherwise */}
      {status === "authenticated" ? (
        <Link
          href={AUTH_DESTINATION_ENERGY}
          aria-label="Open energy & commodities hub"
          className="energyBtn iconBox"
          prefetch
        >
          <span aria-hidden className="energyIcon" style={{ fontSize: 28, lineHeight: 1 }}>
            ⚡
          </span>
        </Link>
      ) : (
        <button
          type="button"
          className="energyBtn iconBox"
          aria-label="Open energy & commodities hub (sign in required)"
          onClick={handleUnauthedRick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleUnauthedRick(e);
          }}
        >
          <span aria-hidden className="energyIcon" style={{ fontSize: 28, lineHeight: 1 }}>
            ⚡
          </span>
        </button>
      )}

      {/* NEW: Insights — /insights if authed; Rick otherwise */}
      {status === "authenticated" ? (
        <Link
          href={AUTH_DESTINATION_INSIGHTS}
          aria-label="Open insights (portfolio blog)"
          className="insightsBtn iconBox"
          prefetch
        >
          <span aria-hidden className="insightsIcon" style={{ fontSize: 28, lineHeight: 1 }}>
            ✍️
          </span>
        </Link>
      ) : (
        <button
          type="button"
          className="insightsBtn iconBox"
          aria-label="Open insights (sign in required)"
          onClick={handleUnauthedRick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleUnauthedRick(e);
          }}
        >
          <span aria-hidden className="insightsIcon" style={{ fontSize: 28, lineHeight: 1 }}>
            ✍️
          </span>
        </button>
      )}

      {/* Gold Nugget (pickaxe + nugget inside the component) */}
      {status === "authenticated" ? (
        <Link
          href={AUTH_DESTINATION_PICKAXE}
          aria-label="Open commodities"
          className="goldBtn iconBox"
          prefetch
        >
          <GoldNugget size={40} />
        </Link>
      ) : (
        <button
          type="button"
          className="goldBtn iconBox"
          aria-label="Open commodities (sign in required)"
          onClick={handleUnauthedRick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleUnauthedRick(e);
          }}
        >
          <GoldNugget size={40} />
        </button>
      )}

      {/* Coaster: /models if authed; Rick otherwise */}
      {status === "authenticated" ? (
        <Link
          href={AUTH_DESTINATION_COASTER}
          aria-label="Open models"
          className="coasterBtn iconBox"
          prefetch
        >
          <RollerCoaster size={28} />
        </Link>
      ) : (
        <button
          type="button"
          className="coasterBtn iconBox"
          aria-label="Open models (sign in required)"
          onClick={handleUnauthedRick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleUnauthedRick(e);
          }}
        >
          <RollerCoaster size={28} />
        </button>
      )}

      {/* Sticky Note (between coaster and folder) */}
      {status === "authenticated" ? (
        <Link
          href={AUTH_DESTINATION_NOTE}
          aria-label="Open notes"
          className="noteBtn iconBox"
          prefetch
        >
          <StickyNoteSVG size={36} />
        </Link>
      ) : (
        <button
          type="button"
          className="noteBtn iconBox"
          aria-label="Open notes (sign in required)"
          onClick={handleUnauthedRick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleUnauthedRick(e);
          }}
        >
          <StickyNoteSVG size={36} />
        </button>
      )}

      {/* Folder: /finder if authed; Rick otherwise */}
      <button
        type="button"
        aria-label="Open folder"
        className="folderBtn iconBox"
        onClick={handleFolderClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFolderClick();
          }
        }}
      >
        <Folder size={0.4} color="#5227FF" />
      </button>

      <style>{`
        :root {
          --btn-size: 44px; /* standardized hitbox */
          --focus-ring: 2px;
        }

        .iconBox {
          width: var(--btn-size);
          height: var(--btn-size);
          display: grid;
          place-items: center;
          cursor: pointer;
          text-decoration: none;
          border-radius: 8px;
          outline: none;
          border: none;
          background: transparent;
          padding: 0;
        }

        /* Make ONLY the sticky note's hitbox a tad larger */
        .noteBtn.iconBox {
          width: 52px;
          height: 52px;
        }

        .iconBox:focus-visible {
          box-shadow: 0 0 0 var(--focus-ring)
            color-mix(in oklab, #5227ff 60%, white 0%);
        }

        /* Crystal ball animations */
        .futureBtn:hover .futureIcon,
        .futureBtn:focus-visible .futureIcon {
          animation: future-spin 900ms ease-in-out both, future-breath 1500ms ease-in-out infinite;
          text-shadow: 0 0 6px rgba(130, 90, 255, 0.5);
        }
        @keyframes future-spin {
          0% { transform: rotate(0deg) scale(1); }
          40% { transform: rotate(-12deg) scale(1.05); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes future-breath {
          0% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0); }
        }

        /* Energy (bolt) animations */
        .energyBtn:hover .energyIcon,
        .energyBtn:focus-visible .energyIcon {
          animation: energy-pop 320ms cubic-bezier(.2,.7,.2,1) both, energy-breathe 1400ms ease-in-out 320ms infinite;
          text-shadow: 0 0 6px rgba(255, 234, 0, 0.5);
        }
        @keyframes energy-pop {
          0% { transform: scale(1) rotate(0deg); filter: brightness(1); }
          60% { transform: scale(1.2) rotate(-6deg); filter: brightness(1.25); }
          100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
        }
        @keyframes energy-breathe {
          0% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0); }
        }

        /* News (paper) animations */
        .newsBtn:hover .newsIcon,
        .newsBtn:focus-visible .newsIcon {
          animation: news-pop 260ms cubic-bezier(.2,.7,.2,1) both, news-bob 1200ms ease-in-out 260ms infinite;
          text-shadow: 0 0 6px rgba(80, 120, 255, 0.45);
        }
        @keyframes news-pop {
          0% { transform: scale(1) rotate(0deg); }
          60% { transform: scale(1.18) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes news-bob {
          0% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0); }
        }

        /* Insights (pen) animations */
        .insightsBtn:hover .insightsIcon,
        .insightsBtn:focus-visible .insightsIcon {
          animation: ins-pop 280ms cubic-bezier(.2,.7,.2,1) both, ins-breathe 1300ms ease-in-out 280ms infinite;
          text-shadow: 0 0 6px rgba(255, 160, 90, 0.45);
        }
        @keyframes ins-pop {
          0% { transform: scale(1) rotate(0deg); }
          60% { transform: scale(1.16) rotate(-4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes ins-breathe {
          0% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0); }
        }

        /* Coaster animation (unchanged) */
        .coasterBtn:hover :global(.coaster-anim),
        .coasterBtn:focus-visible :global(.coaster-anim) {
          animation: rc-wiggle 900ms ease-in-out both, rc-bob 1200ms ease-in-out infinite;
        }

        /* Gold nugget/pickaxe animations */
        .goldBtn:hover :global(.gold-nugget-anim),
        .goldBtn:focus-visible :global(.gold-nugget-anim) {
          animation: gold-swing 900ms ease-in-out both, gold-bob 1200ms ease-in-out infinite;
          transform-origin: 50% 15%;
        }
        @keyframes gold-swing {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          50% { transform: rotate(8deg); }
          75% { transform: rotate(-6deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes gold-bob {
          0% { translate: 0 0; }
          50% { translate: 0 -3px; }
          100% { translate: 0 0; }
        }

        /* Faster sparkles on hover */
        .goldBtn:hover :global(.gold-sparkle),
        .goldBtn:focus-visible :global(.gold-sparkle) {
          animation-duration: 1s;
        }

        /* Pickaxe strike */
        .goldBtn:hover :global(.gp-pickaxe),
        .goldBtn:focus-visible :global(.gp-pickaxe) {
          animation: gp-strike 250ms cubic-bezier(.2,.7,.2,1) both;
          transform-origin: 16px 12px;
        }
        @keyframes gp-strike {
          0%   { transform: rotate(0deg) translate(0,0); }
          40%  { transform: rotate(-12deg) translate(-0.5px, 0.2px); }
          100% { transform: rotate(0deg) translate(0,0); }
        }

        /* Impact flash */
        .goldBtn:hover :global(.gp-impact),
        .goldBtn:focus-visible :global(.gp-impact) {
          animation: gp-impact 250ms ease-out both;
          transform-origin: center;
        }
        @keyframes gp-impact {
          0%   { opacity: 0; transform: scale(0.2); }
          30%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.6); }
        }

        /* Debris fall */
        .goldBtn:hover :global(.gp-debris-1),
        .goldBtn:focus-visible :global(.gp-debris-1) {
          animation: gp-debris-fall 700ms ease-out both;
        }
        .goldBtn:hover :global(.gp-debris-2),
        .goldBtn:focus-visible :global(.gp-debris-2) {
          animation: gp-debris-fall 700ms ease-out both;
          animation-delay: 70ms;
        }
        .goldBtn:hover :global(.gp-debris-3),
        .goldBtn:focus-visible :global(.gp-debris-3) {
          animation: gp-debris-fall 700ms ease-out both;
          animation-delay: 120ms;
        }
        @keyframes gp-debris-fall {
          0%   { opacity: 0; transform: translate(0, 0) rotate(0deg); }
          20%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-3px, 6px) rotate(25deg); }
        }

        /* Sticky note: idle + hover peel */
        .noteBtn .noteIcon {
          animation: note-idle 6s ease-in-out infinite;
          transform-origin: 80% 10%;
        }
        @keyframes note-idle {
          0%   { transform: rotate(0deg) translateY(0); }
          50%  { transform: rotate(0.6deg) translateY(-1px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        .noteBtn:hover .noteIcon,
        .noteBtn:focus-visible .noteIcon {
          animation: note-wiggle 900ms ease-in-out both, note-bob 1200ms ease-in-out infinite;
        }
        @keyframes note-wiggle {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(6deg); }
          50% { transform: rotate(-5deg); }
          75% { transform: rotate(3deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes note-bob {
          0% { translate: 0 0; }
          50% { translate: 0 -2px; }
          100% { translate: 0 0; }
        }
        .noteBtn:hover .noteCurl,
        .noteBtn:focus-visible .noteCurl {
          animation: curl-peel 800ms cubic-bezier(.2,.7,.2,1) both;
        }
        @keyframes curl-peel {
          0%   { transform: rotate(0deg) translate(0,0) scale(1); opacity: 1; }
          40%  { transform: rotate(-12deg) translate(-0.5px, -0.5px) scale(1.05); opacity: 0.95; }
          100% { transform: rotate(0deg) translate(0,0) scale(1); opacity: 1; }
        }

        /* Reduced-motion fallbacks */
        @media (prefers-reduced-motion: reduce) {
          .coasterBtn:hover :global(.coaster-anim),
          .coasterBtn:focus-visible :global(.coaster-anim),
          .goldBtn:hover :global(.gold-nugget-anim),
          .goldBtn:focus-visible :global(.gold-nugget-anim),
          .noteBtn .noteIcon,
          .noteBtn:hover .noteIcon,
          .noteBtn:focus-visible .noteIcon,
          .noteBtn:hover .noteCurl,
          .noteBtn:focus-visible .noteCurl,
          .futureBtn:hover .futureIcon,
          .futureBtn:focus-visible .futureIcon,
          .energyBtn:hover .energyIcon,
          .energyBtn:focus-visible .energyIcon,
          .newsBtn:hover .newsIcon,
          .newsBtn:focus-visible .newsIcon,
          .insightsBtn:hover .insightsIcon,
          .insightsBtn:focus-visible .insightsIcon {
            animation: none !important;
            transform: translateY(-2px);
            text-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}

/** Inline sticky note SVG so you don’t need another component file */
function StickyNoteSVG({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="noteIcon"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="note-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF4A3" />
          <stop offset="100%" stopColor="#FFE36B" />
        </linearGradient>
        <linearGradient id="note-curl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFBE2" />
          <stop offset="100%" stopColor="#FFE36B" />
        </linearGradient>
        <linearGradient id="note-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.20)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
        </linearGradient>
      </defs>

      {/* Paper */}
      <rect x="5" y="5" width="20" height="20" rx="3" ry="3" fill="url(#note-paper)" />

      {/* Curl (bottom-right) — give it a class so we can animate it */}
      <path
        className="noteCurl"
        d="M25 21 v4 h-4 c2 0 4-2 4-4z"
        fill="url(#note-curl)"
        style={{ transformBox: "fill-box", transformOrigin: "100% 100%" }}
      />

      {/* Top pin strip */}
      <rect x="5" y="7" width="20" height="3" rx="1.5" fill="#FFC857" opacity="0.9" />

      {/* Lines */}
      <rect x="7.5" y="12" width="14" height="1.2" rx="0.6" fill="#D9B54A" opacity="0.7" />
      <rect x="7.5" y="15" width="10" height="1.2" rx="0.6" fill="#D9B54A" opacity="0.6" />
      <rect x="7.5" y="18" width="12" height="1.2" rx="0.6" fill="#D9B54A" opacity="0.55" />

      {/* Soft shadow at bottom */}
      <rect x="5" y="25" width="20" height="1.2" fill="url(#note-shadow)" opacity="0.5" />
    </svg>
  );
}
