// Shared motion constants for the liquid-glass dashboard. Timing/easing
// values live here so the chart draw-on, the scroll reveals and the
// pointer tilt all read from one place. `SMOOTH_EASE` / `COUNT_UP_MS`
// deliberately stay in lib/ui/use-count-up.ts — the financial-figure
// count-up is its own concern and must not drift with these.

/** Recharts draw-on duration, first mount only. */
export const CHART_DRAW_MS = 900;

/** easeOutCubic — Recharts `animationEasing` doesn't take a bezier. */
export const CHART_EASE = "ease-out" as const;

/** easeOutQuint-ish; matches `--ease-glide` in app/globals.css. */
export const REVEAL_EASE = "cubic-bezier(0.16, 1, 0.3, 1)" as const;

/** Max tilt in degrees for <TiltCard>. */
export const TILT_DEG = 6;

/** Delay step between staggered scroll-in sections. */
export const REVEAL_STAGGER_MS = 70;

/** Spring config for the pointer-tilt motion values. */
export const TILT_SPRING = { stiffness: 150, damping: 20, mass: 0.4 } as const;
