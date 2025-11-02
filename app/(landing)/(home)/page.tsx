// app/(landing)/(home)/page.tsx
"use client";

import ContactLink from '@shared/components/ContactLink';
import Folder from '@/components/Folder';
import ASCIIText from '@/components/ASCIIText';
import { useSession } from 'next-auth/react';
import UserStatus from '@/components/UserStatus';

const DESTINATION = '/dashboard'; // change to your authed target path
const RICK = 'https://youtu.be/dQw4w9WgXcQ?si=ejrEVACw40p2BpNw';

export default function HomePage() {
    const { status } = useSession(); // 'loading' | 'unauthenticated' | 'authenticated'

    const handleFolderClick = () => {
        if (status === 'loading') return;

        if (status === 'authenticated') {
            // Use browser navigation to avoid typed-routes type checks on router.push
            window.location.assign(DESTINATION);
        } else {
            // Open the YouTube link in a new tab (click handler avoids popup blockers)
            window.open(RICK, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <main
            style={{
                minHeight: '100svh',
                width: '100%',
                display: 'grid',
                placeItems: 'center',
                paddingInline: 'clamp(1rem, 4vw, 3rem)',
                paddingBlock: 'clamp(2rem, 6vh, 4rem)',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Top-right: Hello if authed, Sign in link if not */}
            <UserStatus />

            {/* Bottom-left folder */}
            <div
                style={{
                    position: 'fixed',
                    left: 'clamp(4px, 1vw, 12px)',
                    bottom: 'clamp(4px, 1vw, 12px)',
                    zIndex: 10,
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    cursor: status === 'loading' ? 'wait' : 'pointer',
                }}
                aria-label="Open folder"
            >
                <Folder
                    size={0.5}
                    color="#5227FF"
                    onClick={handleFolderClick}
                />
            </div>

            {/* Center hero */}
            <section
                style={{
                    display: 'grid',
                    gap: '1.25rem',
                    justifyItems: 'center',
                    textAlign: 'center',
                    width: '100%',
                }}
            >
                <h1
                    style={{
                        position: 'relative',
                        width: 'min(92vw, 1000px)',
                        height: 'clamp(80px, 22vw, 300px)',
                        margin: 0,
                        lineHeight: 1,
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        userSelect: 'none',
                    }}
                >
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                        <ASCIIText text="Michael Harrison" enableWaves interactive={false} />
                    </div>
                    <span
                        style={{
                            position: 'absolute',
                            width: 1,
                            height: 1,
                            padding: 0,
                            margin: -1,
                            whiteSpace: 'nowrap',
                            border: 0,
                        }}
                    >
                        Michael Harrison
                    </span>
                </h1>

                <ContactLink />
            </section>
        </main>
    );
}