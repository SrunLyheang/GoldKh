"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";

// Gentle sine-like ease-in-out, no fast section — digits climb at a steady,
// readable rate rather than the front-loaded blur an ease-out gives. Shared
// so every number roll in the app matches.
export const SMOOTH_EASE = [0.37, 0, 0.63, 1] as const;

// Long enough that the per-frame step stays small — counted, not scrubbed.
export const COUNT_UP_MS = 2200;

interface CountUpOptions {
  durationMs?: number;
  // Formats the interpolated number for display. Read through a ref so an
  // inline arrow doesn't restart the tween every render; only `target` re-aims.
  format: (value: number) => string;
  // Roll start. 0 = count up from zero on every page entry; unset = start at
  // `target` (no mount animation, later changes tween).
  from?: number;
}

// Rolls the displayed number to `target`.
//  - `from` unset: no mount animation; later `target` changes tween, re-aiming
//    mid-flight.
//  - `from` given: one entrance tween on mount, then later `target` changes
//    SNAP — a unit toggle must not replay a 2.2s roll across every card.
//
// Under `prefers-reduced-motion` the value snaps (required for financial figures).
//
// No "animate once" guard: StrictMode double-mounts effects, and a first-run
// latch would make a real refresh snap. `aimedAtRef` tracks the last value we
// started a tween toward, so a StrictMode replay still animates while a genuine
// `target` change is recognised as an update.
export function useCountUp(
  target: number,
  { durationMs = COUNT_UP_MS, format, from }: CountUpOptions
): string {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(from ?? target);
  const formatRef = useRef(format);
  const aimedAtRef = useRef<number | undefined>(undefined);

  const [display, setDisplay] = useState(() => format(from ?? target));

  // Latest formatter, without making it a tween dependency.
  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    const fmt = formatRef.current;

    // Post-entrance `target` change in `from` mode: snap, don't tween.
    // `aimedAtRef` is undefined on first run / unchanged across a StrictMode
    // replay, so the entrance tween is unaffected.
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
