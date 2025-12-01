"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: Route;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Energy & Commodities", href: "/commodities" },
  { label: "Energy thesis", href: "/energy" },
  { label: "Models", href: "/models" },
  { label: "Strategies", href: "/strategies" },
  { label: "News", href: "/news" },
  { label: "Future", href: "/future" },
  { label: "Finder", href: "/finder" },
  { label: "Insights", href: "/insights" },
  { label: "Notes", href: "/notes" },
];

export default function PageNavigation() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") {
    return null;
  }

  return (
    <nav className="page-nav" aria-label="Primary navigation">
      <div className="page-nav-inner">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`page-nav-link${pathname === item.href ? " page-nav-link--active" : ""}`}
            prefetch
          >
            {item.label}
          </Link>
        ))}
      </div>

      <style jsx>{`
        .page-nav {
          position: sticky;
          top: 0;
          z-index: 20;
          width: 100%;
          background: color-mix(in oklab, var(--background) 90%, white 10%);
          border-bottom: 1px solid var(--rule);
          padding: 0.4rem 0.75rem;
        }

        .page-nav-inner {
          max-width: 1080px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.35rem 1rem;
        }

        .page-nav-link {
          text-decoration: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 0.35rem 0.5rem;
          border-radius: 999px;
          border: 1px solid transparent;
        }

        .page-nav-link--active {
          border-color: color-mix(in oklab, var(--foreground) 60%, var(--text-muted));
          color: var(--foreground);
        }

        .page-nav-link:hover,
        .page-nav-link:focus-visible {
          border-color: var(--rule);
          color: var(--foreground);
        }
      `}</style>
    </nav>
  );
}
