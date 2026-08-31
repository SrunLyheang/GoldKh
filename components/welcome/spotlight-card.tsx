"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

interface SpotlightCardProps {
  children: ReactNode;
  // Passed straight through to the rendered card <div> — callers keep
  // their existing `liquid-glass rounded-… border …` classes here.
  className?: string;
}

// Wraps a glass card so a soft amber glow tracks the cursor across its
// surface while the pointer is over it, fading out on leave. Purely
// decorative: the tracking is disabled outright on coarse pointers
// (touch) and under `prefers-reduced-motion`, where the card renders
// exactly as it would without this wrapper. The pointer position is
// written to CSS custom properties (`--spot-x` / `--spot-y` / the
// `--spot-opacity` gate) so moving the cursor never re-renders React.
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reduceMotion || typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;
    // Deferred to an effect (not a lazy initializer) so the SSR markup
    // and the client's first paint agree; only then do we opt in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(window.matchMedia("(pointer: fine)").matches);
  }, [reduceMotion]);

  const cardClassName = ["spotlight-card", className].filter(Boolean).join(" ");

  if (!enabled) {
    return (
      <div className={cardClassName}>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--spot-x", `${x}%`);
    el.style.setProperty("--spot-y", `${y}%`);
    el.style.setProperty("--spot-opacity", "1");
  };

  const handleLeave = () => {
    ref.current?.style.setProperty("--spot-opacity", "0");
  };

  return (
    <div
      ref={ref}
      className={cardClassName}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
