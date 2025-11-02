import AsciiText from '@features/landing/components/AsciiText';
import ContactLink from '@shared/components/ContactLink';

export default function HomePage() {
    return (
        <main
            style={{
                minHeight: '100svh',
                display: 'grid',
                placeItems: 'center',
                padding: '2rem',
            }}
        >
            <section
                style={{
                    display: 'grid',
                    gap: '1.25rem',
                    justifyItems: 'center',
                    textAlign: 'center',
                }}
            >
                {/* Give the hero a predictable box for the ASCII canvas */}
                <h1
                    style={{
                        position: 'relative',              // anchor absolute children
                        width: 'min(92vw, 1200px)',
                        height: 'clamp(140px, 18vw, 260px)', // canvas height
                        margin: 0,
                        lineHeight: 1,
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                    }}
                    aria-label="Michael Harrison"
                >
                    <AsciiText text="Michael Harrison" enableWaves />
                </h1>

                <ContactLink />
            </section>
        </main>
    );
}