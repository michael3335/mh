import AsciiText from '@features/landing/components/AsciiText';
import ContactLink from '@shared/components/ContactLink';
import Folder from '@features/landing/components/Folder';

export default function HomePage() {
    return (
        <main
            style={{
                minHeight: '100svh',
                width: '100%',
                display: 'grid',
                placeItems: 'center',
                paddingInline: 'clamp(1rem, 4vw, 3rem)',
                paddingBlock: 'clamp(2rem, 6vh, 4rem)',
                overflow: 'hidden', // prevent any shader/canvas overflow on small screens
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
                    touchAction: 'manipulation', // better mobile tap behavior
                }}
                aria-hidden="true"
            >
                <Folder size={0.35} color="#5227FF" className="custom-folder" />
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
                {/* Give the hero a predictable box for the ASCII canvas */}
                <h1
                    style={{
                        position: 'relative',              // anchor absolute children
                        width: 'min(92vw, 1000px)',
                        height: 'clamp(80px, 22vw, 300px)', // fluid canvas height
                        margin: 0,
                        lineHeight: 1,
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                    }}
                    aria-label="Michael Harrison"
                >
                    {/* No cursor-follow; just waves */}
                    <AsciiText text="Michael Harrison" enableWaves interactive={false} />
                </h1>

                <ContactLink />
            </section>
        </main>
    );
}