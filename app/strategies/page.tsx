// app/strategies/page.tsx
export default function StrategiesPage() {
    return (
        <main
            style={{
                maxWidth: 720,
                margin: "0 auto",
                padding: "32px 20px 72px",
            }}
        >
            <header
                style={{
                    paddingBottom: 16,
                    borderBottom: "var(--hairline) solid var(--rule)",
                }}
            >
                <p
                    style={{
                        fontFamily:
                            "var(--font-heading), var(--font-sans), system-ui, -apple-system, 'Segoe UI', sans-serif",
                        fontSize: "0.72rem",
                        letterSpacing: "0.24em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        margin: "0 0 0.75rem",
                    }}
                >
                    Strategies
                </p>
                <h1 style={{ margin: 0 }}>Strategy specs and backtests.</h1>
                <p
                    style={{
                        margin: "0.4rem 0 0",
                        color: "var(--text-secondary)",
                    }}
                >
                    Placeholder for detailed strategy write-ups linked to the Energy hub — each
                    complex will eventually have a concise spec, notes, and a small set of
                    backtests.
                </p>
            </header>
        </main>
    );
}
