"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

// A thin wireframe outline of a gold bar on a viewport-fixed layer
// behind all page content. Deliberately a line-art *graphic device*,
// not a rendered object: single `--primary` stroke, no fill, no gloss,
// no blur, low opacity — so it fits the Vault language (stroke icons,
// hard edges, gold as a restrained accent) instead of reading as a
// shiny 3-D prop.
//
//   - horizontal: a sine of scroll progress glides it left ↔ right
//     ~1.4 full passes across the length of the page.
//   - vertical: eases from near the top of the viewport to lower down
//     as progress runs 0 → 1, with a gentle out-of-phase bob.
//   - rotation: a slow 2-D turn, ~1.2 revolutions over the whole page.
//
// A passive scroll listener updates the target; a single rAF eases the
// rendered pose toward it and writes straight to `style.transform`
// (no React state per frame), stopping once settled so a stationary
// page costs nothing. Under `prefers-reduced-motion` — and with no
// layout (SSR, jsdom) — it stays at the resting pose written inline
// below, and no listener or loop is attached. Decorative only:
// aria-hidden and pointer-events-none.

const AMPLITUDE_VW = 32; // half the horizontal travel, in viewport widths
const PASSES = 1.4; // full left-right sweeps across the whole page
const TOP_START = 24; // vh, bar centre near the top of the viewport at progress 0
const TOP_END = 62; // vh, bar centre lower down at progress 1
const BOB_VH = 5; // gentle vertical wobble amplitude, in vh
const SPINS = 1.2; // full rotations over the length of the page
const REST_ROT = -20; // resting angle, degrees
const EASE = 0.08; // per-frame lerp toward the scroll target
// Deadband: ignore scroll/resize events that move the target less than
// this, so idle layout shifts (count-ups finishing, the scrollbar
// appearing) don't restart the easing loop and make the bar shimmer.
const DEADBAND = 0.4; // vw / vh / deg

const REST_TOP = (TOP_START + TOP_END) / 2;
// `translateZ(0)` keeps the SVG on its own composited layer: the thin
// stroke sits behind `backdrop-filter` cards, and without a cached layer
// those cards re-rasterise it every frame (the hero video and other
// always-on animations keep the compositor busy), so it "boils" at rest.
const REST_TRANSFORM = `translate(-50%, calc(${REST_TOP}vh - 50%)) rotate(${REST_ROT}deg) translateZ(0)`;

interface Pose {
  x: number; // vw offset from horizontal centre
  y: number; // vh from the top of the viewport (bar centre)
  rot: number; // deg
}

const REST: Pose = { x: 0, y: REST_TOP, rot: REST_ROT };

function targetForProgress(p: number): Pose {
  const a = p * Math.PI * 2 * PASSES;
  return {
    x: Math.sin(a) * AMPLITUDE_VW,
    y: TOP_START + (TOP_END - TOP_START) * p + Math.cos(a) * BOB_VH,
    rot: REST_ROT + p * 360 * SPINS,
  };
}

function toTransform(pose: Pose): string {
  return `translate(calc(-50% + ${pose.x.toFixed(2)}vw), calc(${pose.y.toFixed(2)}vh - 50%)) rotate(${pose.rot.toFixed(2)}deg) translateZ(0)`;
}

export function ScrollGoldBar() {
  const reduceMotion = useReducedMotion();
  const barRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || reduceMotion || typeof window === "undefined") return;

    let raf = 0;
    const pose: Pose = { ...REST };
    let target: Pose = { ...REST };

    const readProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    const tick = () => {
      pose.x += (target.x - pose.x) * EASE;
      pose.y += (target.y - pose.y) * EASE;
      pose.rot += (target.rot - pose.rot) * EASE;

      const settled =
        Math.abs(target.x - pose.x) < 0.01 &&
        Math.abs(target.y - pose.y) < 0.01 &&
        Math.abs(target.rot - pose.rot) < 0.05;
      if (settled) {
        // Land exactly on target and write one final frame, so nothing is
        // left easing at sub-pixel amounts.
        pose.x = target.x;
        pose.y = target.y;
        pose.rot = target.rot;
        raf = 0;
      }
      bar.style.transform = toTransform(pose);
      if (!settled) raf = window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const next = targetForProgress(readProgress());
      // Deadband: a scroll or resize that barely moves the target (an
      // idle layout shift, the scrollbar toggling) must not restart the
      // loop, or the bar shimmers while the page is still.
      if (
        Math.abs(next.x - target.x) < DEADBAND &&
        Math.abs(next.y - target.y) < DEADBAND &&
        Math.abs(next.rot - target.rot) < DEADBAND
      ) {
        return;
      }
      target = next;
      if (raf === 0) raf = window.requestAnimationFrame(tick);
    };

    // Snap to wherever the page is already scrolled, then let the loop
    // take over on the next scroll.
    target = targetForProgress(readProgress());
    Object.assign(pose, target);
    bar.style.transform = toTransform(pose);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf !== 0) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduceMotion]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ opacity: 0.18, isolation: "isolate" }}
    >
      <svg
        ref={barRef}
        data-testid="scroll-gold-bar"
        viewBox="0 0 240 140"
        className="absolute left-1/2 top-0 h-auto w-[clamp(220px,26vw,360px)]"
        style={{
          transform: REST_TRANSFORM,
          // Keep the stroke on a stable, cached compositor layer so
          // `backdrop-filter` cards above it don't re-rasterise it every
          // frame and make it shimmer while the page is still.
          willChange: "transform",
          backfaceVisibility: "hidden",
          color: "var(--primary, #e8b84b)",
          overflow: "visible",
        }}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* front face */}
        <path d="M30 70 L170 70 L170 110 L30 110 Z" />
        {/* top face */}
        <path d="M30 70 L70 45 L210 45 L170 70" />
        {/* right face */}
        <path d="M170 70 L210 45 L210 85 L170 110" />
      </svg>
    </div>
  );
}
