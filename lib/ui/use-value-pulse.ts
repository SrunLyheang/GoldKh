"use client";

import { useEffect, useRef, useState } from "react";

// ~600ms — long enough to notice a figure changed, short enough not to
// linger. Matches the `value-pulse` keyframe in app/globals.css.
const PULSE_MS = 600;

// Returns `true` for ~600ms after `value` changes from a prior settled
// value, then `false`. The first render (and the first client render
// after SSR) never pulses — there's no "previous" to have changed from.
// No motion/react dependency; the reduced-motion opt-out lives in CSS
// (`.value-pulse-active` animation is disabled under
// `prefers-reduced-motion`), so this hook stays SSR-safe and cheap.
//
// Pair it with a class toggle on a wrapper around the figure — it does
// NOT change the figure's own snap semantics (useCountUp is untouched).
export function useValuePulse(value: string | number): boolean {
  const previous = useRef(value);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setPulsing(true);
    const id = window.setTimeout(() => setPulsing(false), PULSE_MS);
    return () => window.clearTimeout(id);
  }, [value]);

  return pulsing;
}
