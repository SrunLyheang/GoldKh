"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Scale,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

import { Magnetic } from "./magnetic";
import { useInView } from "./use-reveal";

interface Feature {
  icon: ReactNode;
  title: string;
  body: string;
  proof: ReactNode;
}

// Four things the tracker actually does, in the order someone meets them:
// what did I pay → in which units → what is it worth now → am I up or down.
// The privacy / non-custodial promise has its own section further down the
// page (#about), so it isn't repeated here.
const FEATURES: Feature[] = [
  {
    icon: <Calculator className="h-6 w-6" />,
    title: "Your real average cost",
    body: "Buy at a few different prices and it gets hard to say what your gold actually cost you. GoldKh does the weighted-average math so you always know your break-even.",
    proof: "Know your break-even",
  },
  {
    icon: <Scale className="h-6 w-6" />,
    title: "Works in Chi and Damlung",
    body: "Enter your gold in Chi (ជី) and Damlung (ដំឡឹង), the way it's bought and sold here. Grams and troy ounces are handled in the background.",
    proof: "1 Damlung = 10 Chi = 37.5g",
  },
  {
    icon: <RefreshCw className="h-6 w-6" />,
    title: "Live spot price",
    body: "See what your gold is worth at the current world spot price, with a chart of how it has moved. Every price shows the exact time it was pulled.",
    proof: "Every price is timestamped",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Up or down, at a glance",
    body: "See whether your gold is worth more or less than you paid, in USD, against the latest spot price. This includes the gain or loss on gold you have already sold.",
    proof: "Gain / loss in USD",
  },
];

const AUTO_MS = 6000;
const N = FEATURES.length;

// Shortest signed distance from card `i` to the active card, so the track
// wraps both ways instead of scrolling back through every card.
function delta(i: number, active: number): number {
  let d = i - active;
  if (d > N / 2) d -= N;
  if (d < -N / 2) d += N;
  return d;
}

export function FeatureCoverflow() {
  const reduceMotion = useReducedMotion();
  const { ref: stageRef, visible } = useInView<HTMLDivElement>();

  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const [compact, setCompact] = useState(false);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const cardsHostRef = useRef<HTMLDivElement>(null);
  // Measured height of the tallest card, so the stage fits the longest
  // copy instead of clipping it at a hand-picked fixed height.
  const [stageH, setStageH] = useState<number>();

  // Tighter card spread on narrow screens — the side cards only peek.
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Fit the stage to the tallest card. Cards are `h-full`, so measure each
  // one with its height released, take the max, and drive the stage from it.
  useEffect(() => {
    const host = cardsHostRef.current;
    if (!host) return;
    const measure = () => {
      const cards = host.querySelectorAll<HTMLElement>("article.liquid-glass");
      let tallest = 0;
      cards.forEach((card) => {
        const prev = card.style.height;
        card.style.height = "auto";
        tallest = Math.max(tallest, card.offsetHeight);
        card.style.height = prev;
      });
      if (tallest > 0) setStageH(Math.ceil(tallest));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [compact]);

  // Auto-advance until the reader takes over, then never again.
  useEffect(() => {
    if (reduceMotion || !auto || paused || !visible) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % N), AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, auto, paused, visible]);

  const step = useCallback((dir: 1 | -1) => {
    setAuto(false);
    setActive((a) => (a + dir + N) % N);
  }, []);

  const jump = useCallback((i: number) => {
    setAuto(false);
    setActive(i);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  const spread = compact ? 46 : 56;
  const timerOn = auto && !paused && !reduceMotion && visible;

  return (
    <div
      ref={stageRef}
      className={`transition-all duration-700 motion-reduce:transition-none ${
        visible || reduceMotion
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0"
      }`}
    >
      {/* Position readout — where you are in the set, not a ranking. */}
      <div className="mb-6 flex items-center justify-center gap-3 font-mono text-xs tracking-[0.3em] text-amber-300/80">
        <span aria-hidden="true">{String(active + 1).padStart(2, "0")}</span>
        <span aria-hidden="true" className="h-px w-8 bg-amber-400/25" />
        <span aria-hidden="true" className="text-white/30">
          {String(N).padStart(2, "0")}
        </span>
      </div>

      <p ref={liveRef} className="sr-only" aria-live="polite">
        {`Feature ${active + 1} of ${N}: ${FEATURES[active].title}`}
      </p>

      <div
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        className="mx-auto w-full max-w-4xl"
      >
        <div
          ref={cardsHostRef}
          role="group"
          aria-roledescription="carousel"
          aria-label="Product features"
          tabIndex={0}
          onKeyDown={onKeyDown}
          style={{ height: stageH ?? (compact ? 440 : 360) }}
          className="relative mx-auto w-full overflow-hidden rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        >
          <motion.div
            className="absolute inset-0"
            drag={compact ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            onDragEnd={(_, info) => {
              if (info.offset.x < -44 || info.velocity.x < -320) step(1);
              else if (info.offset.x > 44 || info.velocity.x > 320) step(-1);
            }}
          >
            {FEATURES.map((f, i) => {
              const d = delta(i, active);
              const hidden = Math.abs(d) > 1;
              const isActive = d === 0;
              return (
                <motion.article
                  key={f.title}
                  aria-hidden={!isActive}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${N}: ${f.title}`}
                  initial={false}
                  animate={{
                    x: `${d * spread}%`,
                    scale: isActive ? 1 : 0.82,
                    rotateY: reduceMotion ? 0 : d * -20,
                    opacity: hidden ? 0 : isActive ? 1 : 0.4,
                    filter:
                      isActive || reduceMotion ? "blur(0px)" : "blur(2px)",
                  }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 260, damping: 32 }
                  }
                  style={{
                    // .liquid-glass sets position:relative at plain-class
                    // specificity, which beats Tailwind's `absolute`
                    // utility — force it here, and centre horizontally with
                    // auto margins so motion's `x` transform stays free.
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    marginInline: "auto",
                    zIndex: isActive ? 30 : 10,
                    pointerEvents: isActive ? "auto" : "none",
                    transformPerspective: 1200,
                    // Near-opaque fill on the front card so the stacked
                    // cards behind it don't bleed through; the neighbours
                    // stay glassy.
                    background: isActive
                      ? "rgba(11, 10, 8, 0.94)"
                      : "rgba(11, 10, 8, 0.6)",
                    boxShadow: isActive
                      ? "0 28px 70px -20px rgba(0, 0, 0, 0.8)"
                      : "0 8px 32px rgba(0, 0, 0, 0.35)",
                  }}
                  className={`liquid-glass flex h-full w-[86%] max-w-[420px] flex-col justify-between rounded-[1.75rem] border p-7 sm:p-9 ${
                    isActive ? "border-amber-400/25" : "border-white/10"
                  }`}
                >
                  {/* Assay-stamp hairline: fills over one auto-advance cycle. */}
                  {isActive && timerOn && (
                    <motion.span
                      key={active}
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-[2px] origin-left bg-gradient-to-r from-amber-400/90 to-amber-300/40"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                    />
                  )}
                  {/* Raking amber light across the active card. */}
                  {isActive && !reduceMotion && (
                    <motion.span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]"
                    >
                      <motion.span
                        className="absolute -inset-y-8 w-1/2 bg-[linear-gradient(115deg,transparent_0%,rgba(251,191,36,0.14)_50%,transparent_100%)]"
                        initial={{ x: "-120%" }}
                        animate={{ x: "260%" }}
                        transition={{
                          duration: 3.6,
                          ease: "easeInOut",
                          repeat: Infinity,
                          repeatDelay: 2.4,
                        }}
                      />
                    </motion.span>
                  )}

                  <div className="relative">
                    <div className="liquid-glass-gold mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-amber-400">
                      {f.icon}
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-white">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/65">
                      {f.body}
                    </p>
                  </div>
                  <div className="relative mt-6 flex items-center gap-1.5 border-t border-white/10 pt-4 font-mono text-xs text-amber-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {f.proof}
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-5">
          <Magnetic strength={10}>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous feature"
              className="liquid-glass flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Magnetic>

          <div className="flex items-center gap-2">
            {FEATURES.map((f, i) => (
              <button
                key={f.title}
                type="button"
                onClick={() => jump(i)}
                aria-label={`Go to feature ${i + 1}: ${f.title}`}
                aria-current={i === active}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-8 bg-amber-400"
                    : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <Magnetic strength={10}>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next feature"
              className="liquid-glass flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </Magnetic>
        </div>
      </div>
    </div>
  );
}
