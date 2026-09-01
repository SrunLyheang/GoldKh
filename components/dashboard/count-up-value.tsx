"use client";

import type { ComponentProps } from "react";
import { useCountUp } from "@/lib/ui/use-count-up";
import { cn } from "@/lib/utils";
import { MonoValue } from "./mono-value";

type CountUpValueProps = Omit<ComponentProps<typeof MonoValue>, "children"> & {
  target: number;
  // Passed straight through to useCountUp — see its docs for `from`
  // semantics (unset = no mount roll; 0 = roll up from zero on entry).
  from?: number;
  durationMs?: number;
  format: (value: number) => string;
};

type SizedFigureProps = Omit<ComponentProps<typeof MonoValue>, "children"> & {
  // Reserves the box at this width (see width rationale below).
  sizerText: string;
  displayText: string;
};

// A hidden sizer holding `sizerText` overlaid with the live `displayText`
// in the same grid cell, so the box stays a constant width while the
// figure changes — the formatted string's length shifts every frame
// during a roll ("$0" → "$1,234.56"), and in a shrink-to-fit parent (the
// hero / realized flex rows) that made the whole header jitter sideways.
// Shared by CountUpValue (rolls target from `from`) and AnimatedPnlCard's
// PnlRollingFigure (rolls from a localStorage-remembered previous value).
export function SizedFigure({
  sizerText,
  displayText,
  className,
  ...monoProps
}: SizedFigureProps) {
  return (
    <span className="grid">
      <MonoValue
        {...monoProps}
        aria-hidden
        data-count-up-sizer
        className={cn(className, "invisible [grid-area:1/1] whitespace-nowrap")}
      >
        {sizerText}
      </MonoValue>
      <MonoValue
        {...monoProps}
        className={cn(
          className,
          "[grid-area:1/1] min-w-0 overflow-hidden whitespace-nowrap"
        )}
      >
        {displayText}
      </MonoValue>
    </span>
  );
}

// A leaf wrapper around useCountUp + MonoValue. Two things it isolates:
//
//  1. Re-renders. The tween fires setState ~60fps for the whole roll;
//     keeping that state HERE — in a component that renders only the
//     figure — keeps the per-frame re-render off the card's glass
//     wrappers (Surface → GlassGlow → TiltCard → Panel → SparkleField).
//
//  2. Width. The formatted string changes length every frame while the
//     digits climb ("$0" → "$1,234.56"), and in a shrink-to-fit parent
//     (the hero / realized flex rows) that made the whole header jitter
//     sideways. A hidden sizer holding the FINAL string reserves the box
//     at its settled width; the live figure is overlaid in the same grid
//     cell and clipped if a mid-roll value is briefly wider.
export function CountUpValue({
  target,
  from,
  durationMs,
  format,
  className,
  ...monoProps
}: CountUpValueProps) {
  const value = useCountUp(target, { from, durationMs, format });
  return (
    <SizedFigure
      {...monoProps}
      sizerText={format(target)}
      displayText={value}
      className={className}
    />
  );
}
