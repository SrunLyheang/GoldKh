type SparkleFieldProps = {
  /** Positioning classes. Defaults to a fixed, full-viewport layer. */
  className?: string;
};

/**
 * Ambient gold sparkle background — pure CSS. Three tiled layers of
 * radial-gradient "stars" drift upward at different speeds and twinkle
 * via opacity, plus one slow diagonal shimmer sweep. No canvas, no
 * requestAnimationFrame: everything is a GPU-composited `transform` /
 * `opacity` keyframe, so it stays cheap and doesn't stress the renderer.
 * `aria-hidden`, pointer-transparent, and fully still under
 * `prefers-reduced-motion`.
 */
export function SparkleField({ className }: SparkleFieldProps) {
  return (
    <div
      aria-hidden
      className={className ?? "pointer-events-none fixed inset-0"}
      style={{ overflow: "hidden" }}
    >
      <div className="sparkle-field__layer sparkle-field__layer--a" />
      <div className="sparkle-field__layer sparkle-field__layer--b" />
      <div className="sparkle-field__layer sparkle-field__layer--c" />
      <div className="sparkle-field__shimmer" />

      <style>{`
        .sparkle-field__layer {
          position: absolute;
          left: 0;
          right: 0;
          top: -320px;
          bottom: -320px;
          background-repeat: repeat;
          will-change: transform, opacity;
        }
        .sparkle-field__layer--a {
          background-image:
            radial-gradient(1.6px 1.6px at 24px 32px, rgba(245,217,138,.95), transparent 60%),
            radial-gradient(1.4px 1.4px at 132px 88px, rgba(232,184,75,.85), transparent 60%),
            radial-gradient(2px 2px at 210px 168px, rgba(255,243,214,.95), transparent 60%),
            radial-gradient(1.2px 1.2px at 96px 232px, rgba(232,184,75,.7), transparent 60%);
          background-size: 260px 300px;
          animation: sparkle-field-rise-a 17s linear infinite,
                     sparkle-field-twinkle 4s ease-in-out infinite;
        }
        .sparkle-field__layer--b {
          background-image:
            radial-gradient(1.4px 1.4px at 60px 40px, rgba(245,217,138,.8), transparent 60%),
            radial-gradient(1.8px 1.8px at 240px 120px, rgba(255,243,214,.85), transparent 60%),
            radial-gradient(1.2px 1.2px at 150px 280px, rgba(232,184,75,.7), transparent 60%);
          background-size: 380px 420px;
          opacity: .7;
          animation: sparkle-field-rise-b 27s linear infinite,
                     sparkle-field-twinkle 5.5s ease-in-out infinite;
        }
        .sparkle-field__layer--c {
          background-image:
            radial-gradient(2.4px 2.4px at 100px 90px, rgba(255,243,214,.9), transparent 55%),
            radial-gradient(1.6px 1.6px at 320px 260px, rgba(232,184,75,.7), transparent 60%);
          background-size: 520px 560px;
          opacity: .55;
          animation: sparkle-field-rise-c 40s linear infinite,
                     sparkle-field-twinkle 7s ease-in-out infinite;
        }
        .sparkle-field__shimmer {
          position: absolute;
          inset: -40%;
          background: linear-gradient(115deg,
            transparent 42%,
            rgba(232,184,75,.10) 50%,
            transparent 58%);
          will-change: transform;
          animation: sparkle-field-shimmer 9s ease-in-out infinite;
        }
        @keyframes sparkle-field-rise-a {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(0, -300px, 0); }
        }
        @keyframes sparkle-field-rise-b {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(0, -420px, 0); }
        }
        @keyframes sparkle-field-rise-c {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(0, -560px, 0); }
        }
        @keyframes sparkle-field-twinkle {
          0%, 100% { opacity: .35; }
          50%      { opacity: .9; }
        }
        @keyframes sparkle-field-shimmer {
          0%, 100% { transform: translate3d(-12%, 0, 0); }
          50%      { transform: translate3d(12%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sparkle-field__layer,
          .sparkle-field__shimmer { animation: none; }
        }
      `}</style>
    </div>
  );
}
