"use client";

import React, { useEffect, useRef, RefObject } from "react";
import { gsap } from "gsap";

const lerp = (a: number, b: number, n: number): number => (1 - n) * a + n * b;

const getMousePos = (e: Event, container?: HTMLElement | null): { x: number; y: number } => {
  const mouseEvent = e as MouseEvent;
  if (container) {
    const bounds = container.getBoundingClientRect();
    return {
      x: mouseEvent.clientX - bounds.left,
      y: mouseEvent.clientY - bounds.top,
    };
  }
  return { x: mouseEvent.clientX, y: mouseEvent.clientY };
};

type Mode = "free" | "controlled";

interface CrosshairProps {
  color?: string;
  /** If provided, crosshair is clipped to this container. */
  containerRef?: RefObject<HTMLElement | null>;
  /** "controlled" lets parent set positions; "free" listens to mouse. */
  mode?: Mode;

  /**
   * Controlled positions (container coordinates):
   * - vX: X position for the vertical line (follows cursor)
   * - hY: Y position for the horizontal line (snapped to series)
   */
  vX?: number | null;
  hY?: number | null;

  /** Overall visibility toggle in controlled mode. */
  show?: boolean;

  /** Legacy (kept for compatibility): if provided, both lines go to this point. */
  pos?: { x: number; y: number } | null;
}

const Crosshair: React.FC<CrosshairProps> = ({
  color = "white",
  containerRef = null,
  mode = "free",
  vX = null,
  hY = null,
  show,
  pos = null,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const lineHorizontalRef = useRef<HTMLDivElement>(null);
  const lineVerticalRef = useRef<HTMLDivElement>(null);
  const filterXRef = useRef<SVGFETurbulenceElement>(null);
  const filterYRef = useRef<SVGFETurbulenceElement>(null);

  /* ---------------- Controlled mode ---------------- */
  useEffect(() => {
    if (mode !== "controlled") return;

    const vEl = lineVerticalRef.current;
    const hEl = lineHorizontalRef.current;

    // Back-compat: if pos is provided, it overrides vX/hY
    const vx = pos ? pos.x : vX;
    const hy = pos ? pos.y : hY;

    if (vEl) gsap.set(vEl, { x: vx ?? -9999 }); // move offscreen if null
    if (hEl) gsap.set(hEl, { y: hy ?? -9999 });

    const vVisible = (show ?? true) && vx != null;
    const hVisible = (show ?? true) && hy != null;

    if (vEl) gsap.to(vEl, { opacity: vVisible ? 1 : 0, duration: 0.12, ease: "power3.out", overwrite: true });
    if (hEl) gsap.to(hEl, { opacity: hVisible ? 1 : 0, duration: 0.12, ease: "power3.out", overwrite: true });
  }, [mode, vX, hY, show, pos]);

  /* ---------------- Free mode (original behavior) ---------------- */
  useEffect(() => {
    if (mode !== "free") return;

    let mouse = { x: 0, y: 0 };

    const handleMouseMove = (ev: Event) => {
      const mouseEvent = ev as MouseEvent;
      mouse = getMousePos(mouseEvent, containerRef?.current ?? null);
      if (containerRef?.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        const inside =
          mouseEvent.clientX >= bounds.left &&
          mouseEvent.clientX <= bounds.right &&
          mouseEvent.clientY >= bounds.top &&
          mouseEvent.clientY <= bounds.bottom;

        gsap.to([lineHorizontalRef.current, lineVerticalRef.current].filter(Boolean), { opacity: inside ? 1 : 0 });
      }
    };

    const target: HTMLElement | Window = containerRef?.current || window;
    target.addEventListener("mousemove", handleMouseMove);

    const renderedStyles: {
      [key: string]: { previous: number; current: number; amt: number };
    } = {
      tx: { previous: 0, current: 0, amt: 0.15 },
      ty: { previous: 0, current: 0, amt: 0.15 },
    };

    gsap.set([lineHorizontalRef.current, lineVerticalRef.current].filter(Boolean), { opacity: 0 });

    const onMouseMove = () => {
      renderedStyles.tx.previous = renderedStyles.tx.current = mouse.x;
      renderedStyles.ty.previous = renderedStyles.ty.current = mouse.y;

      gsap.to([lineHorizontalRef.current, lineVerticalRef.current].filter(Boolean), {
        duration: 0.9,
        ease: "Power3.easeOut",
        opacity: 1,
      });

      requestAnimationFrame(render);

      target.removeEventListener("mousemove", onMouseMove);
    };

    target.addEventListener("mousemove", onMouseMove);

    const primitiveValues = { turbulence: 0 };

    const tl = gsap
      .timeline({
        paused: true,
        onStart: () => {
          if (lineHorizontalRef.current) {
            lineHorizontalRef.current.style.filter = "url(#filter-noise-x)";
          }
          if (lineVerticalRef.current) {
            lineVerticalRef.current.style.filter = "url(#filter-noise-y)";
          }
        },
        onUpdate: () => {
          if (filterXRef.current && filterYRef.current) {
            filterXRef.current.setAttribute("baseFrequency", primitiveValues.turbulence.toString());
            filterYRef.current.setAttribute("baseFrequency", primitiveValues.turbulence.toString());
          }
        },
        onComplete: () => {
          if (lineHorizontalRef.current && lineVerticalRef.current) {
            lineHorizontalRef.current.style.filter = "none";
            lineVerticalRef.current.style.filter = "none";
          }
        },
      })
      .to(primitiveValues, {
        duration: 0.5,
        ease: "power1",
        startAt: { turbulence: 1 },
        turbulence: 0,
      });

    const enter = () => tl.restart();
    const leave = () => {
      tl.progress(1).kill();
    };

    const render = () => {
      renderedStyles.tx.current = mouse.x;
      renderedStyles.ty.current = mouse.y;

      for (const key in renderedStyles) {
        const style = renderedStyles[key];
        style.previous = lerp(style.previous, style.current, style.amt);
      }

      if (lineHorizontalRef.current && lineVerticalRef.current) {
        gsap.set(lineVerticalRef.current, { x: renderedStyles.tx.previous });
        gsap.set(lineHorizontalRef.current, { y: renderedStyles.ty.previous });
      }

      requestAnimationFrame(render);
    };

    const links: NodeListOf<HTMLAnchorElement> = containerRef?.current
      ? containerRef.current.querySelectorAll("a")
      : document.querySelectorAll("a");

    links.forEach((link) => {
      link.addEventListener("mouseenter", enter);
      link.addEventListener("mouseleave", leave);
    });

    return () => {
      target.removeEventListener("mousemove", handleMouseMove);
      target.removeEventListener("mousemove", onMouseMove);
      links.forEach((link) => {
        link.removeEventListener("mouseenter", enter);
        link.removeEventListener("mouseleave", leave);
      });
    };
  }, [containerRef, mode]);

  return (
    <div
      ref={cursorRef}
      className={`${containerRef ? "absolute" : "fixed"} top-0 left-0 w-full h-full pointer-events-none z-[10000]`}
    >
      <svg className="absolute top-0 left-0 w-full h-full">
        <defs>
          <filter id="filter-noise-x">
            <feTurbulence type="fractalNoise" baseFrequency="0.000001" numOctaves="1" ref={filterXRef} />
            <feDisplacementMap in="SourceGraphic" scale="40" />
          </filter>
          <filter id="filter-noise-y">
            <feTurbulence type="fractalNoise" baseFrequency="0.000001" numOctaves="1" ref={filterYRef} />
            <feDisplacementMap in="SourceGraphic" scale="40" />
          </filter>
        </defs>
      </svg>
      <div
        ref={lineHorizontalRef}
        className={`absolute w-full h-px pointer-events-none opacity-0 transform translate-y-1/2`}
        style={{ background: color }}
      />
      <div
        ref={lineVerticalRef}
        className={`absolute h-full w-px pointer-events-none opacity-0 transform translate-x-1/2`}
        style={{ background: color }}
      />
    </div>
  );
};

export default Crosshair;
