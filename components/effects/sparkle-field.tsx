"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

type SparkleFieldProps = {
  /** Positioning classes. Defaults to a fixed, full-viewport layer. */
  className?: string;
  /** Inline style — typically an `opacity` override off `--sparkle-opacity`. */
  style?: CSSProperties;
};

/**
 * Ambient gold sparkle background — pure CSS, styles live in
 * `app/globals.css` under `.sparkle-field__*`. Three tiled layers of
 * radial-gradient "stars" drift upward at different speeds and twinkle
 * via opacity, plus one slow diagonal shimmer sweep. No canvas, no
 * requestAnimationFrame: everything is a GPU-composited `transform` /
 * `opacity` keyframe.
 *
 * The one bit of JS: an IntersectionObserver that adds
 * `.sparkle-field--paused` (→ `animation-play-state: paused`) whenever
 * the wrapper scrolls out of view, so the loops stop costing compositor
 * work while the user reads further down the dashboard. Fixed
 * full-viewport uses (auth, landing) never leave the viewport, so they
 * never pause. Falls back to always-running where there is no
 * IntersectionObserver (jsdom, very old browsers).
 *
 * `aria-hidden`, pointer-transparent, and fully still under
 * `prefers-reduced-motion`.
 */
export function SparkleField({ className, style }: SparkleFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        className ?? "pointer-events-none fixed inset-0",
        paused && "sparkle-field--paused"
      )}
      style={{ overflow: "hidden", ...style }}
    >
      <div className="sparkle-field__layer sparkle-field__layer--a" />
      <div className="sparkle-field__layer sparkle-field__layer--b" />
      <div className="sparkle-field__layer sparkle-field__layer--c" />
      <div className="sparkle-field__shimmer" />
    </div>
  );
}
