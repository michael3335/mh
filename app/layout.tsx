// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import AuthProvider from "@/components/AuthProvider";
import BottomLeftControls from "@/components/BottomLeftControls";
import { Inter } from "next/font/google";

// Single strong sans for a bold, minimal aesthetic
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://private.michaelharrison.au"),
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
    url: "https://private.michaelharrison.au",
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
    {
      rel: "icon",
      url: "https://www.michaelharrison.au/favicon.svg",
      type: "image/svg+xml",
      sizes: "any",
    },
    {
      rel: "shortcut icon",
      url: "https://www.michaelharrison.au/favicon.svg",
      type: "image/svg+xml",
      sizes: "any",
    },
    {
      rel: "apple-touch-icon",
      url: "https://www.michaelharrison.au/favicon.svg",
      type: "image/svg+xml",
    },
    {
      rel: "mask-icon",
      url: "https://www.michaelharrison.au/favicon.svg",
      color: "#000000",
    },
  ],
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  // Force a single, bright theme for a black-on-white look
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={inter.variable}
      style={{ colorScheme: "light" }}
    >
      <body className="font-sans antialiased">
        {/* Skip to content for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:border focus:border-black focus:bg-white focus:px-3 focus:py-1"
        >
          Skip to content
        </a>

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
