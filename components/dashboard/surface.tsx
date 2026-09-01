"use client";

import type { HTMLAttributes } from "react";

import { GlassGlow } from "@/components/motion/glass-glow";
import { TiltCard } from "@/components/motion/tilt-card";
import { Panel } from "@/components/dashboard/panel";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  size?: "lg" | "md";
  variant?: "surface" | "accent";
  // Cursor-tracking `--glow-color` bloom over the card. Default on.
  glow?: boolean;
  // Pointer 3-D tilt. Reserved for the hero — stat/data cards read
  // better still — so it defaults off.
  tilt?: boolean;
}

// The interactive dashboard card: a `Panel` (glass) wrapped in the
// cursor glow and, for the hero, the pointer tilt. Both effects self-
// gate through `usePointerFx` — on touch, a narrow viewport, or with
// `prefers-reduced-motion` this renders exactly as a plain `<Panel>`.
export function Surface({ glow = true, tilt = false, ...panelProps }: SurfaceProps) {
  const panel = <Panel {...panelProps} />;
  const inner = tilt ? (
    <TiltCard className="relative" style={{ borderRadius: "var(--glass-radius)" }}>
      {panel}
    </TiltCard>
  ) : (
    panel
  );
  // Round the glow wrapper to the card radius so the `.glass-glow::after`
  // bloom (border-radius: inherit) and the hover lift don't show square
  // corners over the rounded Panel.
  return glow ? (
    <GlassGlow className="rounded-[var(--glass-radius)]">{inner}</GlassGlow>
  ) : (
    inner
  );
}
