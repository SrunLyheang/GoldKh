"use client";

import type { ComponentProps } from "react";
import { useCountUp } from "@/lib/ui/use-count-up";
import { MonoValue } from "./mono-value";

type CountUpValueProps = Omit<ComponentProps<typeof MonoValue>, "children"> & {
  target: number;
  // Passed straight through to useCountUp — see its docs for `from`
  // semantics (unset = no mount roll; 0 = roll up from zero on entry).
  from?: number;
  durationMs?: number;
  format: (value: number) => string;
};

// A leaf wrapper around useCountUp + MonoValue. The tween calls setState
// ~60fps for the whole roll; keeping that state HERE — in a component
// that renders nothing but the figure — stops the per-frame re-render
// from cascading up through the card's glass wrappers (Surface →
// GlassGlow → TiltCard → Panel → SparkleField). Six of those cascades
// running at once on dashboard entry is what made the count-up stutter.
//
// MonoValue lives inside the leaf (rather than wrapping it) so its
// `signed` sign-alignment still sees a plain string child.
export function CountUpValue({
  target,
  from,
  durationMs,
  format,
  ...monoProps
}: CountUpValueProps) {
  const value = useCountUp(target, { from, durationMs, format });
  return <MonoValue {...monoProps}>{value}</MonoValue>;
}
