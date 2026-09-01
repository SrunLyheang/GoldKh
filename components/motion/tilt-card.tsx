"use client";

import { useState, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import { usePointerFx } from "@/components/motion/use-pointer-fx";
import { TILT_DEG, TILT_SPRING } from "@/components/motion/motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  // Max rotation in degrees at the card's edges.
  strength?: number;
  // Render the cursor-tracking glare sheen. Default on.
  glare?: boolean;
}

// A card slab that tilts in 3-D toward the pointer and springs back on
// leave, with an optional glare sheen. Compositor-only (transform +
// opacity). Off `usePointerFx` — coarse pointer, narrow viewport, or
// `prefers-reduced-motion` — it renders a plain `<div>` with the same
// className, so touch and reduced-motion get the static card for free
// (the vitest `motion/react` mock also forces this path). Recipe from
// components/welcome/hero-to-dashboard.tsx.
export function TiltCard({
  children,
  className,
  strength = TILT_DEG,
  glare = true,
}: TiltCardProps) {
  const enabled = usePointerFx();
  const px = useMotionValue(0); // -0.5 … 0.5 across the card
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [strength, -strength]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-strength, strength]), TILT_SPRING);
  const glareX = useTransform(px, [-0.5, 0.5], ["12%", "88%"]);
  const glareY = useTransform(py, [-0.5, 0.5], ["8%", "92%"]);
  const glareBg = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, rgba(255,240,210,0.18), transparent 60%)`;
  const [hovered, setHovered] = useState(false);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleLeave = () => {
    px.set(0);
    py.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      className={className}
      onPointerMove={handleMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {glare && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{ borderRadius: "inherit", background: glareBg, opacity: hovered ? 1 : 0, transition: "opacity 0.3s ease" }}
        />
      )}
      {children}
    </motion.div>
  );
}
