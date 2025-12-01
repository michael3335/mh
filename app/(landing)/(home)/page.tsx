"use client";

import ASCIIText from "@/components/ASCIIText";
import UserStatus from "@/components/UserStatus";

export default function HomePage() {
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
            </section>
        </main>
    );
}
