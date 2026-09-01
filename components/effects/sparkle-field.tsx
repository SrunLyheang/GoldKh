import type { CSSProperties } from "react";

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
 * `opacity` keyframe, so it stays cheap and doesn't stress the renderer.
 * `aria-hidden`, pointer-transparent, and fully still under
 * `prefers-reduced-motion`.
 */
export function SparkleField({ className, style }: SparkleFieldProps) {
  return (
    <div
      aria-hidden
      className={className ?? "pointer-events-none fixed inset-0"}
      style={{ overflow: "hidden", ...style }}
    >
      <div className="sparkle-field__layer sparkle-field__layer--a" />
      <div className="sparkle-field__layer sparkle-field__layer--b" />
      <div className="sparkle-field__layer sparkle-field__layer--c" />
      <div className="sparkle-field__shimmer" />
    </div>
  );
}
