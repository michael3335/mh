// app/(landing)/(home)/page.tsx
"use client";

import ContactLink from '@shared/components/ContactLink';
import Folder from '@/components/Folder';
import ASCIIText from '@/components/ASCIIText';
import { signIn } from 'next-auth/react';

export default function HomePage() {
    const handleFolderLogin = () => {
        // Option A: show provider chooser
        signIn();

        // Option B: go straight to GitHub
        // signIn("github", { callbackUrl: "/" });
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
            {/* Fixed bottom-left folder */}
            <div
                style={{
                    position: 'fixed',
                    left: 'clamp(4px, 1vw, 12px)',
                    bottom: 'clamp(4px, 1vw, 12px)',
                    zIndex: 10,
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    cursor: 'pointer',
                }}
                aria-hidden="false"
                aria-label="Sign in"
            >
                <Folder
                    size={0.5}
                    color="#5227FF"
                    onClick={handleFolderLogin}   // ✅ trigger NextAuth sign-in
                />
            </div>

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
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                        }}
                    >
                        <ASCIIText text="Michael Harrison" enableWaves interactive={false} />
                    </div>

                    <span
                        style={{
                            position: 'absolute',
                            width: 1,
                            height: 1,
                            padding: 0,
                            margin: -1,
                            overflow: 'hidden',
                            clip: 'rect(0,0,1px,1px)',
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