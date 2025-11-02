// app/(landing)/(home)/page.tsx
"use client";

import ContactLink from '@shared/components/ContactLink';
import Folder from '@/components/Folder';
import ASCIIText from '@/components/ASCIIText';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
// If you don't have this component, remove the import + <UserStatus /> below.
import UserStatus from '@/components/UserStatus';

export default function HomePage() {
    const { status } = useSession(); // 'loading' | 'unauthenticated' | 'authenticated'
    const router = useRouter();

    const handleFolderClick = () => {
        if (status === 'loading') return;

        const destination = '/dashboard'; // change to your target route (ensure it exists)

        if (status === 'authenticated') {
            // Use a plain string to avoid typed-routes union errors
            router.push(destination as string);
        } else {
            // Show NextAuth sign-in. After success, redirect to destination.
            signIn(undefined, { callbackUrl: destination });
            // If you only use GitHub and want to skip the provider screen:
            // signIn("github", { callbackUrl: destination });
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
            {/* Top-right user greeting (only if authenticated) */}
            <UserStatus />

            {/* Fixed bottom-left folder */}
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
                    onClick={handleFolderClick} // redirect or sign in
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