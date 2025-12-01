// app/layout.tsx
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import AuthProvider from "@/components/AuthProvider";
import BottomLeftControls from "@/components/BottomLeftControls";

export const metadata: Metadata = {
    metadataBase: new URL('https://private.michaelharrison.au'),
    title: {
        default: 'Michael Harrison',
        template: '%s'
    },
    description: 'Michael Harrison',
    applicationName: 'Michael Harrison',
    authors: [{ name: 'Michael Harrison' }],
    keywords: ['Michael Harrison', 'portfolio', 'software'],
    alternates: { canonical: '/' },
    openGraph: {
        type: 'website',
        url: 'https://private.michaelharrison.au',
        title: 'Michael Harrison',
        siteName: 'Michael Harrison',
        description: 'Michael Harrison',
    },
    twitter: {
        card: 'summary',
        title: 'Michael Harrison',
        description: 'Michael Harrison',
    },
    icons: [
        {
            rel: 'icon',
            url: 'https://www.michaelharrison.au/favicon.svg',
            type: 'image/svg+xml',
            sizes: 'any',
        },
        {
            rel: 'shortcut icon',
            url: 'https://www.michaelharrison.au/favicon.svg',
            type: 'image/svg+xml',
            sizes: 'any',
        },
        {
            rel: 'apple-touch-icon',
            url: 'https://www.michaelharrison.au/favicon.svg',
            type: 'image/svg+xml',
        },
        {
            rel: 'mask-icon',
            url: 'https://www.michaelharrison.au/favicon.svg',
            color: '#0b0b0c',
        },
    ],
    manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    interactiveWidget: 'resizes-content',
    // ✅ themeColor belongs here now:
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0b0b0c' },
    ],
    // Optional but nice: hint supported color schemes
    colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>{children}
                    <BottomLeftControls />
                </AuthProvider>
                {/* Vercel Analytics */}
                <Analytics />
            </body>
        </html>
    );
}
