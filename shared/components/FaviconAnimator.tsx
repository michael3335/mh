'use client';

import { useEffect, useRef } from 'react';

export default function FaviconAnimator() {
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

        const ensure = (id: string, rel: string) => {
            let el = document.querySelector<HTMLLinkElement>(`#${id}`);
            if (!el) {
                el = document.createElement('link');
                el.id = id;
                el.rel = rel;
                el.sizes = 'any';
                el.type = 'image/png';
                document.head.appendChild(el);
            } else {
                // move it to the end so it wins precedence
                document.head.appendChild(el);
            }
            return el;
        };

        const icon = ensure('fav-anim', 'icon');
        const shortcut = ensure('fav-anim-shortcut', 'shortcut icon');

        const size = 32;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d')!;

        const draw = (t: number) => {
            ctx.clearRect(0, 0, size, size);
            // bg
            ctx.fillStyle = '#0b0b0c';
            roundRect(ctx, 1, 1, size - 2, size - 2, 5);
            ctx.fill();
            // gradient
            const g = ctx.createLinearGradient(0, 0, size, size);
            const hue = (t / 40) % 360;
            const col = (o: number) => `hsl(${(hue + o) % 360} 90% 65%)`;
            g.addColorStop(0, col(0));
            g.addColorStop(0.55, col(45));
            g.addColorStop(1, col(85));
            ctx.strokeStyle = g;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            // M
            ctx.beginPath();
            ctx.moveTo(4, 24); ctx.lineTo(4, 8); ctx.lineTo(10, 16); ctx.lineTo(16, 8); ctx.lineTo(16, 24);
            ctx.stroke();
            // H
            ctx.beginPath();
            ctx.moveTo(20, 8); ctx.lineTo(20, 24); ctx.moveTo(28, 8); ctx.lineTo(28, 24); ctx.moveTo(20, 16); ctx.lineTo(28, 16);
            ctx.stroke();

            const href = c.toDataURL('image/png');
            icon.href = href;
            shortcut.href = href;
        };

        let t = 0;
        const animate = () => {
            t += 1;
            draw(t);
            rafRef.current = requestAnimationFrame(animate);
        };

        const start = () => prefersReduced ? draw(0) : (rafRef.current ?? animate());
        const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };

        const vis = () => (document.hidden ? stop() : start());
        document.addEventListener('visibilitychange', vis);
        start();

        return () => {
            document.removeEventListener('visibilitychange', vis);
            stop();
        };
    }, []);

    return null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}