// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import FaviconAnimator from "@shared/components/FaviconAnimator";
import { Analytics } from "@vercel/analytics/react";
import AuthProvider from "@/components/AuthProvider";
import BottomLeftControls from "@/components/BottomLeftControls";
import { Inter, Newsreader } from "next/font/google";

// Fonts (local, no runtime fetch). Inter for UI text; Newsreader for headings.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://michaelharrison.au"),
  title: {
    default: "Michael Harrison",
    template: "%s",
  },
  description: "Michael Harrison",
  applicationName: "Michael Harrison",
  authors: [{ name: "Michael Harrison" }],
  keywords: ["Michael Harrison", "portfolio", "software"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://michaelharrison.au",
    title: "Michael Harrison",
    siteName: "Michael Harrison",
    description: "Michael Harrison",
  },
  twitter: {
    card: "summary",
    title: "Michael Harrison",
    description: "Michael Harrison",
  },
  icons: [
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
    { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#0b0b0c" },
  ],
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable}`}
      // Helps avoid FOUC when user toggles prefers-color-scheme
      style={{ colorScheme: "light dark" }}
    >
      <body className="font-sans antialiased">
        {/* Skip to content for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:border focus:border-current focus:bg-[Canvas] focus:px-3 focus:py-1"
        >
          Skip to content
        </a>

        {/* Live animated favicon (pauses on reduced motion & when tab is hidden) */}
        <FaviconAnimator />

        <AuthProvider>
          <main id="main">{children}</main>
          <BottomLeftControls />
        </AuthProvider>

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}