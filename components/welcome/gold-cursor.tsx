"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// A decorative gold glow that trails the real mouse pointer across the
// landing page. The native arrow/hand cursor is left untouched — this
// layers a soft ambient bloom (matching the hero's gold-glow look), a
// warmer mid halo, and a tiny crisp core locked to the pointer. Each
// outer layer eases toward the pointer at its own rate so the glow
// smears into a soft comet as you move and settles when you stop, and
// it brightens over interactive elements. Renders nothing at all on
// coarse pointers (touch) and under `prefers-reduced-motion`.
export function GoldCursor() {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  const bloomRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // Live pointer target and each layer's eased position, kept in refs so
  // the animation loop never triggers a React render.
  const target = useRef({ x: 0, y: 0 });
  const bloom = useRef({ x: 0, y: 0 });
  const halo = useRef({ x: 0, y: 0 });
  const over = useRef(false);
  const seen = useRef(false);

  useEffect(() => {
    if (reduceMotion || typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(window.matchMedia("(pointer: fine)").matches);
  }, [reduceMotion]);

  useEffect(() => {
    if (!enabled) return;

    const bloomEl = bloomRef.current;
    const haloEl = haloRef.current;
    const dotEl = dotRef.current;
    if (!bloomEl || !haloEl || !dotEl) return;

    let raf = 0;
    const layers = [bloomEl, haloEl, dotEl];
    const show = (v: string) => layers.forEach((el) => (el.style.opacity = v));

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      dotEl.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      if (!seen.current) {
        seen.current = true;
        bloom.current = { x: e.clientX, y: e.clientY };
        halo.current = { x: e.clientX, y: e.clientY };
        show("1");
      }
      const interactive = (e.target as Element | null)?.closest?.(
        "a, button, [role='button'], input, label, summary"
      );
      over.current = Boolean(interactive);
    };

    const onLeave = () => show("0");
    const onEnter = () => {
      if (seen.current) show("1");
    };

    const tick = () => {
      bloom.current.x += (target.current.x - bloom.current.x) * 0.08;
      bloom.current.y += (target.current.y - bloom.current.y) * 0.08;
      halo.current.x += (target.current.x - halo.current.x) * 0.16;
      halo.current.y += (target.current.y - halo.current.y) * 0.16;

      const k = over.current ? 1.35 : 1;
      bloomEl.style.transform = `translate3d(${bloom.current.x}px, ${bloom.current.y}px, 0) translate(-50%, -50%) scale(${k})`;
      haloEl.style.transform = `translate3d(${halo.current.x}px, ${halo.current.y}px, 0) translate(-50%, -50%) scale(${over.current ? 1.5 : 1})`;

      if (seen.current) {
        bloomEl.style.opacity = over.current ? "0.85" : "0.6";
        haloEl.style.opacity = over.current ? "0.9" : "0.7";
        dotEl.style.opacity = "1";
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, [enabled]);

  if (!enabled) return null;

  const base = {
    position: "fixed",
    top: 0,
    left: 0,
    borderRadius: "9999px",
    opacity: 0,
    transition: "opacity 0.35s ease",
    willChange: "transform, opacity",
  } as const;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Wide, soft ambient bloom — the hero-style gold haze. */}
      <div
        ref={bloomRef}
        style={{
          ...base,
          width: 260,
          height: 260,
          background:
            "radial-gradient(circle, rgba(232,184,75,0.28) 0%, rgba(232,184,75,0.12) 38%, rgba(232,184,75,0) 72%)",
          filter: "blur(30px)",
          mixBlendMode: "screen",
        }}
      />
      {/* Warmer mid halo. */}
      <div
        ref={haloRef}
        style={{
          ...base,
          width: 90,
          height: 90,
          background:
            "radial-gradient(circle, rgba(253,224,120,0.5) 0%, rgba(232,184,75,0.28) 45%, rgba(232,184,75,0) 74%)",
          filter: "blur(12px)",
          mixBlendMode: "plus-lighter",
        }}
      />
      {/* Tiny crisp core locked to the pointer. */}
      <div
        ref={dotRef}
        style={{
          ...base,
          width: 6,
          height: 6,
          background: "rgba(255,241,204,0.95)",
          boxShadow: "0 0 10px 3px rgba(251,191,36,0.75)",
          mixBlendMode: "plus-lighter",
        }}
      />
    </div>
  );
}
