"use client";

import { useRef, type ReactNode } from "react";
import { usePointerFx } from "@/components/motion/use-pointer-fx";

interface GlassGlowProps {
  children: ReactNode;
  // Passed through to the rendered wrapper. Callers keep their own
  // `glass-surface rounded-… ` classes here.
  className?: string;
}

// Wraps a glass card so the theme's `--glow-color` blooms under the
// cursor while the pointer is over it, fading out on leave. The glow is
// the `.glass-glow::after` layer in app/globals.css; this component just
// writes `--spot-x` / `--spot-y` / `--spot-opacity` so pointer movement
// never re-renders React. Disabled outright off `usePointerFx` (coarse
// pointer, narrow viewport, or `prefers-reduced-motion`), where it
// renders exactly as it would without the wrapper. Generalised from
// components/welcome/spotlight-card.tsx.
export function GlassGlow({ children, className }: GlassGlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = usePointerFx();

  const cls = ["glass-glow", className].filter(Boolean).join(" ");

  if (!enabled) {
    return (
      <div className={cls}>
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
    <div ref={ref} className={cls} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
