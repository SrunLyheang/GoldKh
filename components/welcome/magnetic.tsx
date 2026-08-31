"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

interface MagneticProps {
  children: ReactNode;
  className?: string;
  // How far, in px, the element is allowed to drift toward the pointer.
  strength?: number;
}

// Wraps an interactive element so it leans toward the cursor while the
// pointer is near it, then springs back on leave. Purely decorative:
// it's disabled outright on coarse pointers (touch) and under
// `prefers-reduced-motion`, and it never intercepts clicks — the wrapped
// element keeps all its own behaviour.
export function Magnetic({
  children,
  className,
  strength = 14,
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduceMotion || typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;
    // Deferred to an effect (not a lazy initializer) so the SSR markup
    // and the client's first paint agree; only then do we opt in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(window.matchMedia("(pointer: fine)").matches);
  }, [reduceMotion]);

  if (!enabled) {
    return <span className={className}>{children}</span>;
  }

  const handleMove = (e: React.MouseEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setOffset({
      x: Math.max(-1, Math.min(1, relX)) * strength,
      y: Math.max(-1, Math.min(1, relY)) * strength,
    });
  };

  return (
    <span
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      style={{
        display: "inline-block",
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform",
      }}
    >
      {children}
    </span>
  );
}
