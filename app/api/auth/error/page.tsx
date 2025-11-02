export default function AuthErrorPage({
    searchParams,
}: {
    searchParams?: { error?: string };
}) {
    const error = searchParams?.error ?? "AccessDenied";

    return (
        <main
            style={{
                minHeight: "100svh",
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                padding: 24,
            }}
        >
            <div>
                <h1 style={{ marginBottom: 8 }}>Access denied</h1>
                <p style={{ opacity: 0.8, marginBottom: 16 }}>
                    {error === "AccessDenied"
                        ? "This site is restricted to a single authorised GitHub account."
                        : `Sign-in failed: ${error}`}
                </p>
                <a
                    href="/"
                    style={{
                        display: "inline-block",
                        border: "1px solid currentColor",
                        borderRadius: 8,
                        padding: "8px 12px",
                        textDecoration: "none",
                    }}
                >
                    Go back home
                </a>
            </div>
        </main>
    );
}