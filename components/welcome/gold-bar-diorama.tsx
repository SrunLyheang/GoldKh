"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// A pointer-reactive, layered diorama that sits *inside* the final CTA
// card, behind the heading and buttons. The single hero photo is used
// twice — once as a blurred cosmic bed filling the card, once cropped
// tight on the bar and anchored to the right — and the gap between them is
// filled with synthetic depth layers (comet beam, gold dust, warm glow).
// Each layer is parallax-shifted by the pointer at its own strength and
// the whole stack is tilted a few degrees toward the cursor, so the flat
// photo reads as a lit scene with depth. A left-side scrim keeps the CTA
// copy readable over it.
//
// Pointer tracking mirrors animated-hero-image: a passive `pointermove`
// listener sets a normalised target, a single rAF eases the rendered pose
// toward it, and the loop snaps + stops once it settles so a stationary
// pointer costs nothing. Ambient life (dust float, glow breath) is pure
// CSS, gated `motion-safe`. Under `prefers-reduced-motion` — and in any
// environment without layout (SSR, jsdom) — it parks at a fixed
// three-quarter pose with every layer at zero offset and never attaches a
// listener. Decorative only: aria-hidden, pointer-events-none.

const HERO_SRC = "/images/goldkh_hero_hand_gold.jpg";
const EASE = 0.08; // per-frame lerp toward the pointer target
const SETTLE = 0.001; // |target - current| below which we snap and stop

// Deterministic dust field — fixed so the server and client markup agree.
// Weighted toward the right where the bar sits. x / y in %, size in px,
// delay in s for the CSS float.
const DUST = [
  { x: 40, y: 22, s: 4, d: 0.6 },
  { x: 48, y: 74, s: 3, d: 2.1 },
  { x: 55, y: 40, s: 5, d: 0.3 },
  { x: 60, y: 18, s: 3, d: 1.8 },
  { x: 64, y: 62, s: 4, d: 1.1 },
  { x: 69, y: 34, s: 6, d: 2.6 },
  { x: 73, y: 80, s: 3, d: 0.9 },
  { x: 78, y: 26, s: 4, d: 1.5 },
  { x: 82, y: 55, s: 5, d: 0.4 },
  { x: 86, y: 40, s: 3, d: 2.3 },
  { x: 89, y: 72, s: 4, d: 1.2 },
  { x: 93, y: 30, s: 3, d: 3.0 },
] as const;

// Resting pose: caught at a gentle three-quarter angle so the scene still
// reads with depth when motion is off.
const REST_STAGE = "rotateX(3deg) rotateY(-8deg)";

interface Pose {
  x: number; // -1..1, pointer offset from card centre on X
  y: number; // -1..1, pointer offset from card centre on Y
}

const CENTER: Pose = { x: 0, y: 0 };

export function GoldBarDiorama() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [pose, setPose] = useState<Pose>(CENTER);
  const poseRef = useRef<Pose>(CENTER);
  const targetRef = useRef<Pose>(CENTER);
  const frameRef = useRef(0);

  useEffect(() => {
    if (reduceMotion || typeof window === "undefined") return;

    const tick = () => {
      const t = targetRef.current;
      const cur = poseRef.current;
      const next: Pose = {
        x: cur.x + (t.x - cur.x) * EASE,
        y: cur.y + (t.y - cur.y) * EASE,
      };
      poseRef.current = next;
      setPose(next);

      if (Math.abs(t.x - next.x) < SETTLE && Math.abs(t.y - next.y) < SETTLE) {
        poseRef.current = t;
        setPose(t);
        frameRef.current = 0;
        return;
      }
      frameRef.current = window.requestAnimationFrame(tick);
    };

    const onPointerMove = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      // Clamp softly past the card edge so leaving it eases out, not snaps.
      targetRef.current = {
        x: Math.max(-1.4, Math.min(1.4, nx)),
        y: Math.max(-1.4, Math.min(1.4, ny)),
      };
      if (frameRef.current === 0) {
        frameRef.current = window.requestAnimationFrame(tick);
      }
    };

    const recentre = () => {
      targetRef.current = CENTER;
      if (frameRef.current === 0) {
        frameRef.current = window.requestAnimationFrame(tick);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", recentre);
    document.addEventListener("mouseleave", recentre);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", recentre);
      document.removeEventListener("mouseleave", recentre);
      if (frameRef.current !== 0) window.cancelAnimationFrame(frameRef.current);
    };
  }, [reduceMotion]);

  // Per-layer transform: parallax translate on X/Y plus a fixed Z so the
  // browser sorts the stack in real perspective.
  const layer = (fx: number, fy: number, z: number): string =>
    reduceMotion
      ? `translate3d(0px, 0px, ${z}px)`
      : `translate3d(${(pose.x * fx).toFixed(1)}px, ${(pose.y * fy).toFixed(1)}px, ${z}px)`;

  const stageTransform = reduceMotion
    ? REST_STAGE
    : `rotateX(${(-pose.y * 4).toFixed(2)}deg) rotateY(${(pose.x * 8).toFixed(2)}deg)`;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
      style={{ perspective: "1400px" }}
    >
      <div
        data-testid="gold-bar-diorama-stage"
        className="absolute inset-0"
        style={{ transform: stageTransform, transformStyle: "preserve-3d" }}
      >
        {/* 1 — Nebula bed: the hero photo filling the card, blurred to a wash. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative,
            oversized and CSS-transformed; next/image's fill model fights the
            parallax transforms and this is never an LCP target. */}
        <img
          data-testid="gold-bar-diorama-bed"
          src={HERO_SRC}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "68% 42%",
            transform: `${layer(8, 8, -140)} scale(1.35)`,
            filter: "blur(10px) saturate(1.15) brightness(0.85)",
            opacity: 0.5,
          }}
        />

        {/* 2 — Comet beam: a raking gold streak echoing the photo's trail. */}
        <div
          data-testid="gold-bar-diorama-beam"
          className="absolute inset-y-0 -left-1/4 w-[150%]"
          style={{
            transform: layer(16, 9, -70),
            background:
              "linear-gradient(100deg, transparent 40%, rgba(255,206,120,0.30) 52%, rgba(255,130,54,0.16) 58%, transparent 70%)",
            mixBlendMode: "screen",
            filter: "blur(8px)",
          }}
        />

        {/* 3 — Gold dust: a deterministic field of drifting motes. */}
        <div
          data-testid="gold-bar-diorama-dust"
          className="absolute inset-0"
          style={{ transform: layer(26, 26, -10) }}
        >
          {DUST.map((p, i) => (
            <span
              key={i}
              className="absolute rounded-full motion-safe:animate-[gbd-dust_7s_ease-in-out_infinite]"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.s,
                height: p.s,
                animationDelay: `${p.d}s`,
                background:
                  "radial-gradient(circle, rgba(255,231,170,0.9) 0%, rgba(244,193,69,0.35) 60%, transparent 100%)",
                filter: "blur(0.5px)",
              }}
            />
          ))}
        </div>

        {/* 4 — Glow: a warm radial bloom behind where the bar sits. */}
        <div
          data-testid="gold-bar-diorama-glow"
          className="absolute right-[6%] top-1/2 h-[95%] w-[58%] -translate-y-1/2 motion-safe:animate-[gbd-glow_6s_ease-in-out_infinite]"
          style={{
            transform: `translateY(-50%) ${layer(22, 18, 10)}`,
            background:
              "radial-gradient(circle at 55% 45%, rgba(255,196,92,0.24) 0%, transparent 62%)",
            filter: "blur(12px)",
          }}
        />

        {/* 5 — Hero bar: the photo cropped tight on the ingot, right-anchored
            and feathered on its left edge so it melts into the card. */}
        <div
          className="absolute right-0 top-0 h-full w-[64%] sm:w-[54%]"
          style={{ transform: layer(30, 24, 40) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
          <img
            data-testid="gold-bar-diorama-bar"
            src={HERO_SRC}
            alt=""
            className="h-full w-full object-cover"
            style={{
              objectPosition: "52% 30%",
              transform: "scale(1.15)",
              filter:
                "drop-shadow(0 24px 60px rgba(240,175,70,0.35)) contrast(1.06) saturate(1.06)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, #000 28%, #000 90%, transparent 100%)",
              maskImage:
                "linear-gradient(90deg, transparent 0%, #000 28%, #000 90%, transparent 100%)",
            }}
          />
        </div>

        {/* 6 — Scrim: darkens the left so the CTA copy stays legible. */}
        <div
          data-testid="gold-bar-diorama-scrim"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(18,11,2,0.62) 0%, rgba(18,11,2,0.18) 44%, transparent 66%)",
          }}
        />
      </div>

      <style>{`
        @keyframes gbd-dust {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-14px) scale(1.3); opacity: 1; }
        }
        @keyframes gbd-glow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
