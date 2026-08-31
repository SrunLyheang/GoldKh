"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef } from "react";

export function AuthMascot() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const lastMove = useRef(0);

  // Cursor offset from the mascot centre, normalised to ~-1..1.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 140, damping: 18, mass: 0.3 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);

  const pupilX = useTransform(sx, [-1, 1], [-6, 6]);
  const pupilY = useTransform(sy, [-1, 1], [-5, 5]);
  const headRotate = useTransform(sx, [-1, 1], [-2.5, 2.5]);
  const headShiftX = useTransform(sx, [-1, 1], [-4, 4]);

  useEffect(() => {
    if (reduce) return;

    const onMove = (e: PointerEvent) => {
      lastMove.current = Date.now();
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      px.set(Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width * 1.1))));
      py.set(Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height * 1.1))));
    };

    // When the cursor holds still, glance around every so often.
    const idle = window.setInterval(() => {
      if (Date.now() - lastMove.current > 2800) {
        px.set((Math.random() * 2 - 1) * 0.55);
        py.set((Math.random() * 2 - 1) * 0.45);
      }
    }, 1900);

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.clearInterval(idle);
    };
  }, [reduce, px, py]);

  // Every animated prop below is a transform or opacity (compositor-only)
  // so the loops stay cheap.
  const spin = {
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut" as const,
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(232,184,75,0.18), transparent 60%)",
        }}
      />

      <motion.svg
        viewBox="0 0 400 560"
        role="img"
        aria-label="GoldKh robot mascot"
        className="relative w-[66%] max-w-[300px]"
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: [0, -12, 0] }}
        transition={
          reduce
            ? { duration: 0.3 }
            : {
                opacity: { duration: 0.6 },
                y: { ...spin, duration: 4.5 },
              }
        }
      >
        <defs>
          <linearGradient id="mascotScreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6d67a" />
            <stop offset="1" stopColor="#e0a93c" />
          </linearGradient>
          <linearGradient id="mascotShimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="mascotScreenClip">
            <rect x="132" y="182" width="136" height="116" rx="32" />
          </clipPath>
        </defs>

        <ellipse cx="200" cy="502" rx="118" ry="18" fill="#0f0c08" opacity="0.12" />

        {/* antenna — sway, with one expanding signal ring + tip pulse */}
        <motion.g
          style={{ transformBox: "view-box", transformOrigin: "200px 152px" }}
          animate={reduce ? undefined : { rotate: [-6, 6, -6] }}
          transition={reduce ? undefined : { ...spin, duration: 2.8 }}
        >
          <rect x="193" y="88" width="14" height="68" rx="7" fill="#14110c" />
          {!reduce && (
            <motion.circle
              cx="200"
              cy="76"
              r="15"
              fill="none"
              stroke="#e8b84b"
              strokeWidth="2.5"
              style={{ transformBox: "view-box", transformOrigin: "200px 76px" }}
              animate={{ scale: [1, 2.3], opacity: [0.55, 0] }}
              transition={{ ...spin, duration: 2.6, repeatDelay: 0.8 }}
            />
          )}
          <motion.circle
            cx="200"
            cy="76"
            r="15"
            fill="#e8b84b"
            style={{ transformBox: "view-box", transformOrigin: "200px 76px" }}
            animate={reduce ? undefined : { scale: [1, 1.16, 1] }}
            transition={reduce ? undefined : { ...spin, duration: 2 }}
          />
        </motion.g>

        {/* ears — occasional twitch */}
        <motion.g
          style={{ transformBox: "view-box", transformOrigin: "103px 240px" }}
          animate={reduce ? undefined : { rotate: [0, 0, -7, 0, 0] }}
          transition={
            reduce
              ? undefined
              : { ...spin, duration: 5.5, times: [0, 0.64, 0.72, 0.82, 1] }
          }
        >
          <rect x="86" y="238" width="34" height="96" rx="17" fill="#14110c" />
        </motion.g>
        <motion.g
          style={{ transformBox: "view-box", transformOrigin: "297px 240px" }}
          animate={reduce ? undefined : { rotate: [0, 0, 7, 0, 0] }}
          transition={
            reduce
              ? undefined
              : {
                  ...spin,
                  duration: 5.5,
                  times: [0, 0.64, 0.72, 0.82, 1],
                  delay: 2.6,
                }
          }
        >
          <rect x="280" y="238" width="34" height="96" rx="17" fill="#14110c" />
        </motion.g>

        {/* head — leans toward the cursor */}
        <motion.g
          style={
            reduce
              ? undefined
              : {
                  transformBox: "view-box",
                  transformOrigin: "200px 322px",
                  rotate: headRotate,
                  x: headShiftX,
                }
          }
        >
          <rect x="104" y="150" width="192" height="188" rx="48" fill="#14110c" />
          <rect
            x="132"
            y="182"
            width="136"
            height="116"
            rx="32"
            fill="url(#mascotScreen)"
          />

          {!reduce && (
            <g clipPath="url(#mascotScreenClip)">
              <motion.rect
                x="90"
                y="176"
                width="60"
                height="128"
                fill="url(#mascotShimmer)"
                initial={{ x: 0 }}
                animate={{ x: [0, 160] }}
                transition={{ ...spin, duration: 2.6, repeatDelay: 3.6 }}
              />
            </g>
          )}

          {/* eyes — blink wraps the cursor-tracking pupils */}
          <motion.g
            style={{ transformBox: "view-box", transformOrigin: "200px 240px" }}
            animate={reduce ? undefined : { scaleY: [1, 1, 0.12, 1, 1] }}
            transition={
              reduce
                ? undefined
                : { ...spin, duration: 4.6, times: [0, 0.86, 0.9, 0.94, 1] }
            }
          >
            <circle cx="176" cy="240" r="17" fill="#fdf6e3" />
            <circle cx="224" cy="240" r="17" fill="#fdf6e3" />
            <motion.circle
              cx="176"
              cy="240"
              r="8"
              fill="#14110c"
              style={reduce ? undefined : { x: pupilX, y: pupilY }}
            />
            <motion.circle
              cx="224"
              cy="240"
              r="8"
              fill="#14110c"
              style={reduce ? undefined : { x: pupilX, y: pupilY }}
            />
          </motion.g>
        </motion.g>

        {/* torso — gentle breathing */}
        <motion.g
          style={{ transformBox: "view-box", transformOrigin: "200px 434px" }}
          animate={reduce ? undefined : { scaleY: [1, 1.03, 1] }}
          transition={reduce ? undefined : { ...spin, duration: 3.6 }}
        >
          <path
            d="M150 348h100a44 44 0 0 1 44 44v42H106v-42a44 44 0 0 1 44-44z"
            fill="#14110c"
          />
          <rect x="176" y="390" width="48" height="14" rx="7" fill="#e8b84b" />
        </motion.g>
      </motion.svg>
    </div>
  );
}
