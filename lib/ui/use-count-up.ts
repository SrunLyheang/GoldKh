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

// Rolls the displayed number to `target`. Behaviour depends on `from`:
//
//  - `from` unset: no mount animation (starts at `target`); every later
//    `target` change tweens from wherever the roll is now to the new
//    value, re-aiming mid-flight.
//  - `from` given: one entrance tween `from` -> `target` on mount, then
//    every later `target` change SNAPS. This is what a unit toggle
//    (chi <-> damlung) needs — re-labelling the same figure must not
//    replay a 2.2s roll across the headline and every stat card at once.
//
// Under `prefers-reduced-motion` nothing tweens — the value snaps, which
// is the required behaviour for financial figures.
//
// No "animate once" guard on purpose: React StrictMode (on by default in
// `next dev`) mounts effects twice, and any first-run latch would make
// the second mount snap — i.e. no visible animation on a real refresh.
// `aimedAtRef` tracks the value we last *started a tween toward*, so the
// StrictMode replay (same `target`) still animates while a genuine change
// (different `target`) is recognised as an update.
// (context/design-specs/03-dashboard-animation-and-input-feedback.md)
export function useCountUp(
  target: number,
  { durationMs = COUNT_UP_MS, format, from }: CountUpOptions
): string {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(from ?? target);
  const formatRef = useRef(format);
  const aimedAtRef = useRef<number | undefined>(undefined);

  const [display, setDisplay] = useState(() => format(from ?? target));

  // Keep the latest formatter without making it a tween dependency.
  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    const fmt = formatRef.current;

    // A genuine post-entrance `target` change while in `from` mode: snap,
    // don't tween. `aimedAtRef` is undefined on the first run and unchanged
    // across a StrictMode replay, so the entrance tween is unaffected.
    const isPostEntranceChange =
      from !== undefined &&
      aimedAtRef.current !== undefined &&
      aimedAtRef.current !== target;

    aimedAtRef.current = target;

    if (reduceMotion || !Number.isFinite(target) || isPostEntranceChange) {
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
  }, [target, durationMs, reduceMotion, motionValue, from]);

  return display;
}
