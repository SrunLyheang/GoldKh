"use client";

import { useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { useCountUp } from "@/lib/ui/use-count-up";
import {
  computeMarketingPosition,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
  INDICATIVE_SPOT_PER_DAMLUNG,
  type MarketingBuy,
} from "./marketing-calc";
import { useInView } from "./use-reveal";

// A fixed illustrative ledger — the same weighted-average math the rest
// of the page uses, so the numbers here agree with the simulator below.
const DEMO_BUYS: MarketingBuy[] = [
  { id: "d1", quantity: 1, unit: "damlung", pricePerDamlung: 4600 },
  { id: "d2", quantity: 1, unit: "damlung", pricePerDamlung: 4850 },
  { id: "d3", quantity: 5, unit: "chi", pricePerDamlung: 4700 },
];
const DEMO = computeMarketingPosition(DEMO_BUYS, INDICATIVE_SPOT_PER_DAMLUNG);

const SPRING = { stiffness: 140, damping: 16, mass: 0.6 } as const;
const TILE_EASE = [0.22, 1, 0.36, 1] as const;

// The bridge between the hero and the rest of the page. When the section
// scrolls into view it plays a one-shot reveal: a lit 3-D sphere ("your
// gold") docks into the corner of a dashboard card whose stat tiles
// stand up off the table one after another, their figures counting from
// zero. The card then lives on a perspective stage — moving the pointer
// over it tilts the whole slab in 3-D, a specular glare tracks the
// cursor, and each tile lifts toward you on hover. A wireframe gold bar
// spins beside the copy.
//
// Everything animated is gated on `useReducedMotion()`: when it is set
// the component renders the finished, flat state with no springs, no
// pointer listeners and no infinite loops — see `StaticBridge` below.
export function HeroToDashboard() {
  const reduceMotion = useReducedMotion();
  const { ref, visible } = useInView<HTMLDivElement>();

  const count = visible ? 1 : 0;
  const avgCost = useCountUp(DEMO.averageCostPerDamlung * count, {
    durationMs: 1400,
    format: (v) => formatUsd(v),
  });
  const held = useCountUp(DEMO.totalDamlung * count, {
    durationMs: 1400,
    format: (v) => v.toFixed(2),
  });
  const worth = useCountUp(DEMO.marketValueUsd * count, {
    durationMs: 1400,
    format: (v) => formatUsd(v),
  });
  const pnl = useCountUp(DEMO.unrealizedUsd * count, {
    durationMs: 1400,
    format: (v) => formatSignedUsd(v),
  });

  const tiles = [
    { label: "Average cost", value: avgCost, sub: "/ damlung" },
    {
      label: "You hold",
      value: held,
      sub: `damlung · ${DEMO.totalChi.toFixed(1)} chi`,
    },
    { label: "Worth now", value: worth, sub: `${DEMO.totalOz.toFixed(2)} oz` },
    {
      label: "Up / down",
      value: pnl,
      sub: formatSignedPercent(DEMO.unrealizedPercent),
      gain: true,
    },
  ];

  // ── Pointer-driven 3-D state for the card slab ──────────────────────
  const px = useMotionValue(0); // -0.5 … 0.5 across the card
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-18, 18]), SPRING);
  const glareX = useTransform(px, [-0.5, 0.5], ["12%", "88%"]);
  const glareY = useTransform(py, [-0.5, 0.5], ["8%", "92%"]);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, rgba(255,240,210,0.28), transparent 60%)`;
  const [hovered, setHovered] = useState(false);

  if (reduceMotion) {
    return <StaticBridge sectionRef={ref} tiles={tiles} />;
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleLeave = () => {
    px.set(0);
    py.set(0);
    setHovered(false);
  };

  return (
    <section
      ref={ref}
      aria-label="How a ledger comes together"
      className="relative z-10 overflow-hidden border-t border-white/10 px-5 py-28 sm:px-8"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Left: docking sphere + spinning bar + thesis copy */}
        <div className="relative" style={{ perspective: 900 }}>
          {/* The 3-D "your gold" sphere that docks into the card corner */}
          <motion.div
            className="pointer-events-none absolute"
            style={{ left: "6%", top: "-10%", width: 220, height: 220 }}
            initial={false}
            animate={
              visible
                ? { x: -34, y: -54, scale: 0.32, opacity: 0.9 }
                : { x: 0, y: 0, scale: 1, opacity: 1 }
            }
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* cast shadow */}
            <motion.div
              className="absolute left-1/2 rounded-[50%] bg-black/50 blur-2xl"
              style={{ bottom: "2%", width: "78%", height: "22%", x: "-50%" }}
              animate={{ scaleX: [1, 1.08, 1], opacity: [0.5, 0.35, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* sphere body */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 34% 30%, #fff5db 0%, #ffd27a 26%, #e8963c 52%, #7a3f12 78%, #3a1d08 100%)",
                boxShadow:
                  "inset -22px -20px 44px rgba(0,0,0,0.55), inset 18px 16px 32px rgba(255,240,200,0.5), 0 0 60px rgba(232,150,60,0.45)",
              }}
            />
            {/* orbiting specular highlight */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
            >
              <div
                className="absolute rounded-full bg-white/80 blur-md"
                style={{ width: "26%", height: "26%", left: "16%", top: "14%" }}
              />
            </motion.div>
            {/* ambient sparks */}
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full bg-amber-200"
                style={{
                  left: `${18 + i * 22}%`,
                  top: `${70 + (i % 2) * 12}%`,
                  boxShadow: "0 0 10px rgba(255,220,150,0.9)",
                }}
                animate={{
                  y: [0, -26 - i * 6, 0],
                  opacity: [0, 1, 0],
                  scale: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 3 + i * 0.7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            ))}
          </motion.div>

          <div className="relative z-10 max-w-md" style={{ perspective: 700 }}>
            <motion.div
              initial={false}
              animate={
                visible ? { opacity: 1, y: 0, z: 0 } : { opacity: 0, y: 24, z: -40 }
              }
              transition={{ duration: 0.7, ease: TILE_EASE, delay: 0.1 }}
            >
              <span className="mb-3 inline-block font-mono text-xs font-semibold uppercase tracking-widest text-amber-400">
                ✦ Every buy, one picture
              </span>
              <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                Your buys roll up into one position.
              </h2>
              <p className="text-sm leading-relaxed text-white/60 sm:text-base">
                Every buy you record — at whatever price, on whatever day — folds
                into a single view: what you paid on average, what it&apos;s
                worth today, and whether you&apos;re ahead.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right: the dashboard card on a 3-D perspective stage */}
        <div
          style={{ perspective: 1100 }}
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
          onPointerEnter={() => setHovered(true)}
        >
          <motion.div
            className="relative"
            initial={false}
            animate={
              visible
                ? { opacity: 1, y: 0, rotateX: 0 }
                : { opacity: 0, y: 40, rotateX: -18 }
            }
            transition={{ duration: 0.8, ease: TILE_EASE }}
          >
            {/* No infinite idle-float here: continuously translating a
                `backdrop-filter` slab re-samples its blurred backdrop every
                frame and the 1px border crawls between sub-pixels (a
                visible shiver at rest). The one-shot reveal + pointer tilt
                below carry the motion. */}
            <div>
              {/* pointer-tilt slab */}
              <motion.div
                className="liquid-glass relative rounded-3xl border border-white/10 p-5 sm:p-7"
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                  boxShadow: hovered
                    ? "0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,184,75,0.25)"
                    : "0 24px 50px -24px rgba(0,0,0,0.6)",
                  transition: "box-shadow 0.3s ease",
                }}
              >
                {/* cursor-tracking glare */}
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  style={{ background: glare, opacity: hovered ? 1 : 0 }}
                />

                <div
                  className="mb-4 flex items-center justify-between border-b border-white/10 pb-3"
                  style={{ transform: "translateZ(30px)" }}
                >
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/60">
                    Position
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                      animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    Indicative
                  </span>
                </div>

                <div
                  className="grid grid-cols-2 gap-3 font-mono"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {tiles.map((t, i) => (
                    <motion.div
                      key={t.label}
                      className="rounded-2xl border border-white/10 bg-black/30 p-3.5"
                      style={{ transformStyle: "preserve-3d" }}
                      initial={false}
                      animate={
                        visible
                          ? { opacity: 1, rotateX: 0, z: 24 }
                          : { opacity: 0, rotateX: -60, z: -50 }
                      }
                      transition={{
                        duration: 0.7,
                        ease: TILE_EASE,
                        delay: 0.25 + i * 0.09,
                      }}
                      whileHover={{
                        z: 70,
                        scale: 1.05,
                        borderColor: "rgba(232,184,75,0.5)",
                        transition: { duration: 0.2 },
                      }}
                    >
                      <span className="block text-[10px] uppercase tracking-wide text-white/45">
                        {t.label}
                      </span>
                      <span
                        className={`mt-1 block text-lg font-bold tabular-nums ${
                          t.gain ? "text-emerald-400" : "text-white"
                        }`}
                      >
                        {t.value}
                      </span>
                      <span
                        className={`block text-[10px] ${
                          t.gain ? "text-emerald-400/70" : "text-white/40"
                        }`}
                      >
                        {t.sub}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Reduced-motion / no-layout fallback: the finished state of everything
// above, rendered as plain elements. No springs, pointer listeners or
// infinite loops. `useReducedMotion()` is mocked to `true` in the test
// setup, so this is also the branch the unit tests exercise.
function StaticBridge({
  sectionRef,
  tiles,
}: {
  sectionRef: React.RefObject<HTMLDivElement | null>;
  tiles: {
    label: string;
    value: string;
    sub: string;
    gain?: boolean;
  }[];
}) {
  return (
    <section
      ref={sectionRef}
      aria-label="How a ledger comes together"
      className="relative z-10 overflow-hidden border-t border-white/10 px-5 py-28 sm:px-8"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-24 w-24 rounded-full"
            style={{
              left: "6%",
              top: "-6%",
              background:
                "radial-gradient(circle at 34% 30%, #fff5db 0%, #ffd27a 30%, #e8963c 60%, #3a1d08 100%)",
              boxShadow: "0 0 40px rgba(232,150,60,0.4)",
            }}
          />
          <div className="relative z-10 max-w-md">
            <span className="mb-3 inline-block font-mono text-xs font-semibold uppercase tracking-widest text-amber-400">
              ✦ Every buy, one picture
            </span>
            <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Your buys roll up into one position.
            </h2>
            <p className="text-sm leading-relaxed text-white/60 sm:text-base">
              Every buy you record — at whatever price, on whatever day — folds
              into a single view: what you paid on average, what it&apos;s worth
              today, and whether you&apos;re ahead.
            </p>
          </div>
        </div>

        <div
          className="liquid-glass rounded-3xl border border-white/10 p-5 sm:p-7"
          style={{ opacity: 1 }}
        >
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/60">
              Position
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Indicative
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono">
            {tiles.map((t) => (
              <div
                key={t.label}
                className="rounded-2xl border border-white/10 bg-black/30 p-3.5"
                style={{ opacity: 1 }}
              >
                <span className="block text-[10px] uppercase tracking-wide text-white/45">
                  {t.label}
                </span>
                <span
                  className={`mt-1 block text-lg font-bold tabular-nums ${
                    t.gain ? "text-emerald-400" : "text-white"
                  }`}
                >
                  {t.value}
                </span>
                <span
                  className={`block text-[10px] ${
                    t.gain ? "text-emerald-400/70" : "text-white/40"
                  }`}
                >
                  {t.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
