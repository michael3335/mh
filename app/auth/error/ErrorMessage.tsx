// app/auth/error/ErrorMessage.tsx
"use client";

import DecryptedText from "@/components/DecryptedText";

const mono =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace';

export default function ErrorMessage() {
    return (
        <div
            className="wrap"
            style={{
                position: "relative",
                width: "100%",
                maxWidth: 860,
                marginInline: "auto",
                padding: "28px 34px",
                borderRadius: 12,
                border: "1px solid rgba(255,0,60,0.22)",
                boxShadow:
                    "0 0 14px rgba(255,0,60,0.18), inset 0 0 6px rgba(255,0,60,0.18)",
                overflow: "hidden",
                backdropFilter: "blur(2px)",
            }}
        >
            {/* Light scanlines for texture */}
            <div className="scan" aria-hidden />

            {/* Headline with decrypt */}
            <div
                className="headline"
                style={{
                    color: "rgba(255,0,60,0.95)",
                    fontSize: "2.25rem",
                    letterSpacing: "0.04em",
                    fontWeight: 700,
                    textShadow:
                        "0 0 12px rgba(255,0,60,0.55), 0 0 22px rgba(255,0,60,0.25)",
                    fontFamily: mono,
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center",
                    userSelect: "none",
                }}
            >
                <DecryptedText
                    text="ACCESS DENIED"
                    animateOn="view"
                    revealDirection="start"
                    sequential
                    speed={30}
                    maxIterations={200}
                    characters="!#%*&@^?01"
                />
            </div>

            <style jsx>{`
        .wrap {
          transform: translateZ(0);
        }

        .scan {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255, 0, 60, 0.045) 0px,
            rgba(255, 0, 60, 0.045) 2px,
            rgba(0, 0, 0, 0) 3px
          );
          mix-blend-mode: screen;
          opacity: 0.5;
          animation: scan 9s linear infinite;
        }
        @keyframes scan {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
        </div>
    );
}