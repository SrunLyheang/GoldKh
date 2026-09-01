"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// Progress of an element through the viewport, as a number 0 → 1.
//
//  - 0 while the element's top edge is still at or below the bottom of
//    the viewport (not yet scrolled into play),
//  - 1 once the element has been scrolled far enough that its bottom edge
//    has passed a point `finishAtViewportFraction` down the screen.
//
// Driven off a passive scroll listener that only schedules one rAF at a
// time, so a fast flick still costs one layout read per frame. Under
// `prefers-reduced-motion` — and in any environment without layout (SSR,
// jsdom) — it stays pinned at 1 so consumers render their finished state
// with no motion.
export function useScrollProgress(
  ref: React.RefObject<HTMLElement | null>,
  finishAtViewportFraction = 0.55,
): number {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(reduceMotion ? 1 : 0);
  const frameRef = useRef(0);

  useEffect(() => {
    // Both branches below settle the value once for an environment that
    // has no live scroll to track (reduced motion, SSR/jsdom); the
    // scroll listener path does its updates inside a rAF callback.
    if (reduceMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(1);
      return;
    }

    const el = ref.current;
    if (!el || typeof window === "undefined") {
      setProgress(1);
      return;
    }

    const measure = () => {
      frameRef.current = 0;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const travel = rect.height + viewportH * finishAtViewportFraction;
      // Distance scrolled since the element's top touched the viewport
      // bottom, over the total distance it travels before "finishing".
      const scrolled = viewportH - rect.top;
      const next = Math.min(1, Math.max(0, scrolled / travel));
      setProgress(next);
    };

    const onScroll = () => {
      if (frameRef.current === 0) {
        frameRef.current = window.requestAnimationFrame(measure);
      }
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameRef.current !== 0) window.cancelAnimationFrame(frameRef.current);
    };
  }, [ref, reduceMotion, finishAtViewportFraction]);

  return progress;
}

// Linear interpolation clamped to [a, b]. Small helper so scroll-driven
// components can map a slice of progress onto a real CSS value without
// each one re-deriving the clamp.
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin;
  const t = Math.min(1, Math.max(0, (value - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}
