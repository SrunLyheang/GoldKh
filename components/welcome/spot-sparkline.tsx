"use client";

import { useMemo } from "react";

// A small, self-contained price line — an impression of the timestamped
// spot feed the signed-in dashboard shows, not a real one. The path is
// deterministic (a fixed pseudo-random walk) so server and client render
// identical markup. The "draw" is a pure CSS stroke animation (no
// per-frame React state, so it never adds work during scroll) and it's
// switched off under `prefers-reduced-motion` by the rule in globals.css.

const WIDTH = 320;
const HEIGHT = 96;
const POINTS = 48;
// Comfortably longer than the real path so `stroke-dasharray` fully
// hides then reveals it without measuring at runtime.
const DASH = 900;

function buildWalk(seed: number): number[] {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const out: number[] = [];
  // Start low and climb: a steady upward trend with candle-to-candle
  // jitter on top, so it reads like a stock rallying through the day
  // rather than a flat random walk.
  let v = 0.14;
  for (let i = 0; i < POINTS; i++) {
    const trend = 0.0165; // per-step drift toward the top
    v += trend + (rand() - 0.5) * 0.09;
    v = Math.max(0.08, Math.min(0.94, v));
    out.push(v);
  }
  return out;
}

export function SpotSparkline({ className }: { className?: string }) {
  const values = useMemo(() => buildWalk(20260831), []);

  const d = useMemo(() => {
    const step = WIDTH / (POINTS - 1);
    return values
      .map((v, i) => {
        const x = i * step;
        const y = HEIGHT - v * (HEIGHT - 12) - 6;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [values]);

  const last = values[values.length - 1];
  const dotY = HEIGHT - last * (HEIGHT - 12) - 6;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      role="img"
      aria-label="Illustrative gold price movement"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(232,184,75,0.25)" />
          <stop offset="100%" stopColor="rgba(232,184,75,0)" />
        </linearGradient>
      </defs>
      <path d={`${d} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`} fill="url(#spark-fill)" />
      <path
        className="spark-line"
        d={d}
        fill="none"
        stroke="#e8b84b"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: DASH }}
      />
      <circle className="spark-dot" cx={WIDTH} cy={dotY} r={3.5} fill="#e8b84b" />
    </svg>
  );
}
