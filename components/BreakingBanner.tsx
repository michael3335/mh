"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { source: string; title: string; url: string; publishedAt?: string | null };

export default function BreakingBanner() {
    const [item, setItem] = useState<Item | null>(null);

    async function load() {
        try {
            const res = await fetch("/api/breaking", { cache: "no-store" });
            const json = await res.json();
            setItem(json.item ?? null);
        } catch {
            // ignore
        }
    }

    useEffect(() => {
        load();
        const id = setInterval(load, 60_000); // refresh every 60s
        return () => clearInterval(id);
    }, []);

    if (!item) return null;

    return (
        <div role="region" aria-label="Breaking news" className="breaking">
            <span className="flash" aria-hidden>●</span>
            <span className="label">Breaking</span>
            <span className="sep" aria-hidden>·</span>
            <Link href={item.url} target="_blank" className="headline">
                {item.title}
            </Link>
            <span className="source"> — {item.source}</span>

            <style jsx>{`
        .breaking {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border: 1px solid color-mix(in oklab, CanvasText 20%, Canvas 80%);
          background: color-mix(in oklab, CanvasText 6%, Canvas 94%);
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .flash { color: #d00; font-size: 14px; animation: pulse 1.2s infinite; }
        .label { font-weight: 700; letter-spacing: 0.02em; }
        .sep { opacity: 0.5; }
        .headline { text-decoration: none; color: LinkText; font-weight: 600; }
        .source { color: color-mix(in oklab, CanvasText 60%, Canvas 40%); }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        @media (max-width: 640px) { .source { display: none; } }
      `}</style>
        </div>
    );
}