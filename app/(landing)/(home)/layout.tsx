import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Michael Harrison',
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    // Add header/footer here later if landing grows
    return children;
}