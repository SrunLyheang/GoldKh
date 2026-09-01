"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

// One gate for every decorative pointer effect on the dashboard (tilt,
// cursor glow, magnetic buttons). Returns `true` only on a fine pointer,
// a viewport at least `md` wide, and with no `prefers-reduced-motion`.
// The opt-in is deferred to an effect (starts `false`) so the SSR markup
// and the client's first paint agree, and so jsdom — where `matchMedia`
// is stubbed and there is no layout — always gets the static branch.
// Mirrors the pattern in components/welcome/spotlight-card.tsx.
export function usePointerFx(): boolean {
  const reduceMotion = useReducedMotion();
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;
    const fine = window.matchMedia("(pointer: fine)");
    const wide = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      setMatches(fine.matches && wide.matches);
    };
    sync();
    fine.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
    };
  }, []);

  // `reduceMotion` gates in render, not the effect — a synchronous
  // setState in an effect for state derivable at render trips
  // react-hooks/set-state-in-effect.
  return matches && !reduceMotion;
}
