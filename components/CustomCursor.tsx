"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const scaleRef = useRef(1);
    const BASE_SIZE = 22;

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        const position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        let frame: number | null = null;

        const render = () => {
            const size = BASE_SIZE * scaleRef.current;
            cursor.style.transform = `translate3d(${position.x - size / 2}px, ${position.y - size / 2
                }px, 0) scale(${scaleRef.current})`;
            cursor.style.opacity = "1";
            frame = null;
        };

        const handleMove = (event: MouseEvent) => {
            position.x = event.clientX;
            position.y = event.clientY;
            if (frame === null) {
                frame = requestAnimationFrame(render);
            }
        };

        const setScale = (next: number) => {
            if (scaleRef.current === next) return;
            scaleRef.current = next;
            render();
        };

        const handleMouseOver = (event: MouseEvent) => {
            const target = event.target;
            if (target instanceof Element && target.closest("a")) {
                setScale(14 / 22);
            }
        };

        const handleMouseOut = (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const anchor = target.closest("a");
            if (!anchor) return;

            const related = event.relatedTarget;
            if (related instanceof Element && anchor.contains(related)) return;
            setScale(1);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseover", handleMouseOver);
        window.addEventListener("mouseout", handleMouseOut);
        render();

        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseover", handleMouseOver);
            window.removeEventListener("mouseout", handleMouseOut);
        };
    }, []);

    return <div ref={cursorRef} className="custom-cursor" aria-hidden="true" />;
}
