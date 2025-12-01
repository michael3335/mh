import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: "100svh",
        background: "var(--background)",
        color: "var(--foreground)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: 540,
          padding: "48px",
          borderRadius: 20,
          border: "1px solid var(--rule)",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          background: "color-mix(in oklab, var(--background) 90%, white 10%)",
        }}
      >
        <span
          style={{
            fontSize: 20,
            letterSpacing: "0.6em",
            textTransform: "uppercase",
            opacity: 0.65,
          }}
        >
          404
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 4vw, 42px)",
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-heading), var(--font-sans)",
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: 380,
            fontSize: 16,
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          The page you are looking for doesn’t exist yet. You can head back to the
          home page or explore the Energy &amp; Commodities lab if you are looking for
          research and dashboards.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <Link
            href="/"
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid var(--rule)",
              background: "var(--background)",
              color: "var(--foreground)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Return home
          </Link>
          <Link
            href="/commodities"
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid var(--rule)",
              background: "var(--foreground)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Open Energy &amp; Commodities lab
          </Link>
        </div>
      </div>
    </main>
  );
}
