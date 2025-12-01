"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  unit: string;
  price: number | null;
  prev: number | null;
  change: number | null;
  changePct: number | null;
};

export default function CommoditiesMiniBoard() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [base, setBase] = useState<"AUD" | "USD">("AUD");
  const [error, setError] = useState<string | null>(null);

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: base,
        maximumFractionDigits: 2,
      }),
    [base],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        const res = await fetch("/api/commodities", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setItems((json.items as Item[]) ?? null);
          setBase((json.base as "AUD" | "USD") ?? "AUD");
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load data";
          setError(msg);
        }
      }
    }

    load();
    const id = setInterval(load, 300_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const top = (items ?? []).slice(0, 3);
  const rows: (Item | null)[] =
    top.length > 0
      ? top
      : Array.from({ length: 3 }, () => null);

  return (
    <div
      aria-label="Snapshot of key commodities"
      style={{
        display: "grid",
        gap: 8,
      }}
    >
      {error && (
        <div
          role="status"
          style={{
            fontSize: 12,
            color: "rgba(255,120,120,0.95)",
          }}
        >
          Commodities snapshot error: {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: 4,
          fontSize: 12,
          opacity: 0.7,
        }}
      >
        <span>Name</span>
        <span style={{ textAlign: "right" }}>Last ({base})</span>
        <span style={{ textAlign: "right" }}>Δ%</span>
      </div>

      {rows.map((row, idx) => {
        if (!row) {
          return (
            <div
              key={`skeleton-${idx}`}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: 4,
                fontSize: 12,
                opacity: 0.4,
              }}
            >
              <span>
                <span>Loading…</span>
              </span>
              <span style={{ textAlign: "right" }}>—</span>
              <span style={{ textAlign: "right" }}>—</span>
            </div>
          );
        }
        const up = (row.change ?? 0) >= 0;
        return (
          <div
            key={row.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: 4,
              fontSize: 12,
              opacity: items ? 1 : 0.4,
            }}
          >
            <span>
              <strong>{row.name}</strong>{" "}
              <span style={{ opacity: 0.6 }}>({row.unit})</span>
            </span>
            <span style={{ textAlign: "right" }}>
              {row.price == null || !items ? "—" : fmt.format(row.price)}
            </span>
            <span
              style={{
                textAlign: "right",
                color: !items
                  ? "inherit"
                  : up
                  ? "var(--pos, #22c55e)"
                  : "var(--neg, #ef4444)",
              }}
            >
              {row.changePct == null || !items
                ? "—"
                : `${up ? "+" : ""}${row.changePct.toFixed(2)}%`}
            </span>
          </div>
        );
      })}

      <div style={{ marginTop: 4, fontSize: 11, opacity: 0.75 }}>
        <Link
          href="/commodities"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          Open full Energy &amp; Commodities Lab<span aria-hidden> ↗</span>
        </Link>
      </div>
    </div>
  );
}
