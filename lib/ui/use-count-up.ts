"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";

// Gentle sine-like ease-in-out — no fast section anywhere in the curve,
// so the digits climb at a steady, readable rate instead of the burst an
// ease-out gives (which dumps ~80% of the travel into the first ~400ms
// and reads as a blur). Soft start, soft landing. One constant so every
// number roll in the app feels the same.
export const SMOOTH_EASE = [0.37, 0, 0.63, 1] as const;

// Long enough that the per-frame step stays small — the number should
// look like it's being counted, not scrubbed. A UI transition is not the
// yardstick for a value the user is meant to watch land.
export const COUNT_UP_MS = 2200;

interface CountUpOptions {
  // Total tween time. Longer than a UI transition on purpose — a value
  // landing is meant to be watched.
  durationMs?: number;
  // Turns the interpolated number into the string actually shown. Read
  // through a ref so callers can pass an inline arrow without the tween
  // restarting on every render — only a change to `target` re-aims it.
  format: (value: number) => string;
  // Starting point for the roll. Set it to 0 for the "count up from zero
  // on every page entry" entrance; leave it unset to start already at
  // `target` (no mount animation, only later changes tween).
  from?: number;
}

// Rolls the displayed number to `target`:
//  - on mount, from `from` (if given) to `target`;
//  - whenever `target` changes, from wherever the roll is now to the new
//    `target`, re-aiming mid-flight.
// Under `prefers-reduced-motion` nothing tweens — the value snaps, which
// is the required behaviour for financial figures.
//
// No "animate once" guard on purpose: React StrictMode (on by default in
// `next dev`) mounts effects twice, and any first-run latch would make
// the second mount snap — i.e. no visible animation on a real refresh.
// (context/design-specs/03-dashboard-animation-and-input-feedback.md)
export function useCountUp(
  target: number,
  { durationMs = COUNT_UP_MS, format, from }: CountUpOptions
): string {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(from ?? target);
  const formatRef = useRef(format);

  const [display, setDisplay] = useState(() => format(from ?? target));

  // Keep the latest formatter without making it a tween dependency.
  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    const fmt = formatRef.current;

    if (reduceMotion || !Number.isFinite(target)) {
      motionValue.set(target);
      setDisplay(fmt(target));
      return;
    }

    const controls = animate(motionValue, target, {
      duration: durationMs / 1000,
      ease: SMOOTH_EASE,
      onUpdate: (value) => setDisplay(fmt(value)),
    });
    return () => controls.stop();
  }, [target, durationMs, reduceMotion, motionValue]);

  return display;
}
