"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { formatPercent, formatUsd } from "@/lib/format/money";
import { PULSE_TONE, toneFromAmount } from "@/lib/format/tone";
import type { CSSProperties } from "react";
import { SMOOTH_EASE } from "@/lib/ui/use-count-up";

const PNL_ROLL_MS = 900;
import { useValuePulse } from "@/lib/ui/use-value-pulse";
import { cn } from "@/lib/utils";
import { SizedFigure } from "./count-up-value";
import { MonoValue } from "./mono-value";
import { t } from "@/lib/i18n/dictionary";

// Unlike the other stat cards (which roll up from zero), the Unrealized
// Gain/Loss figure rolls from the value the user last saw — persisted in
// localStorage — to the new one, so on a refresh it visibly moves up or
// down from where the position was. First visit, an unchanged value, or
// prefers-reduced-motion render static. Colour tracks the value sign; the
// percent sub-line snaps.
const STORAGE_KEY = "goldkh-last-pnl";

// The rolling figure, isolated in its own leaf. The tween fires setState
// ~60fps for the whole roll; keeping that state here — in a component
// that renders only the number — keeps the per-frame re-render off the
// Surface / glass wrappers, so the card doesn't stutter while it counts.
function PnlRollingFigure({
  gainLossUsd,
  tone,
}: {
  gainLossUsd: string;
  tone: ReturnType<typeof toneFromAmount>;
}) {
  const reduceMotion = useReducedMotion();
  const current = Number(gainLossUsd);

  // Non-null only while a roll is in flight.
  const [rolling, setRolling] = useState<string | null>(null);

  // Hidden-sizer text. Normally the settled string; while rolling from a
  // wider previous value (e.g. -$1,234.56 -> +$50.00) the early frames
  // are wider than settled, so the sizer widens to the wider endpoint
  // for the duration of the roll and the live figure isn't clipped.
  const [sizerText, setSizerText] = useState(() => formatUsd(gainLossUsd));

  useEffect(() => {
    let previous: number | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw !== null && raw !== "" && Number.isFinite(Number(raw))) {
        previous = Number(raw);
      }
    } catch {
      // storage unavailable — treat as first visit
    }

    // Persist only once we're done reading `previous` for real — i.e. in
    // the no-animation branches, or when the roll finishes. Writing it
    // synchronously here would poison React StrictMode's second mount
    // (on by default in `next dev`): it would read back the value we just
    // wrote, see no change, and snap — no visible animation on refresh.
    const persist = () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, gainLossUsd);
      } catch {
        // ignore
      }
    };

    const settledStr = formatUsd(gainLossUsd);

    if (
      previous === null ||
      previous === current ||
      !Number.isFinite(current) ||
      reduceMotion
    ) {
      persist();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRolling(null);
      setSizerText(settledStr);
      return;
    }

    // The roll is monotonic between the endpoints, so the widest frame is
    // one of them. Reserve the box at whichever is wider for the roll.
    const previousStr = formatUsd(String(previous));
    setSizerText(previousStr.length > settledStr.length ? previousStr : settledStr);

    const controls = animate(previous, current, {
      // Under a second: long enough to read as "it moved", short enough
      // not to hold up the person who just wants the number.
      duration: PNL_ROLL_MS / 1000,
      ease: SMOOTH_EASE,
      onUpdate: (v) => setRolling(formatUsd(String(v))),
      onComplete: () => {
        setRolling(null);
        setSizerText(settledStr);
        persist();
      },
    });
    return () => controls.stop();
  }, [gainLossUsd, current, reduceMotion]);

  const settled = formatUsd(gainLossUsd);
  const display = rolling ?? settled;

  return (
    <SizedFigure
      tone={tone}
      signed
      sizerText={sizerText}
      displayText={display}
      className="figure block text-figure-lg font-semibold"
    />
  );
}

export function AnimatedPnlCard({
  label,
  gainLossUsd,
  gainLossPercent,
}: {
  label: string;
  gainLossUsd: string;
  gainLossPercent: string;
}) {
  const tone = toneFromAmount(gainLossUsd);
  const pulsing = useValuePulse(gainLossUsd);
  const words = tone === "gain" ? t.stat.up : t.stat.down;

  // The bottom line of the position, ruled off as a total. The one figure
  // that may move on arrival: it rolls from the value you saw last time to
  // today's, because that change is the news.
  return (
    <div
      data-tone={tone}
      className="ledger-sum mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
    >
      <p className="font-serif text-figure text-foreground">
        {words}
        <span className="sr-only"> ({label})</span>
      </p>
      <p className="flex items-baseline gap-2">
        <span
          className={cn("inline-block px-1", pulsing && "value-pulse-active")}
          style={{ "--pulse-tone": PULSE_TONE[tone] ?? "var(--gold-leaf)" } as CSSProperties}
        >
          <PnlRollingFigure gainLossUsd={gainLossUsd} tone={tone} />
        </span>
        <MonoValue tone={tone} signed className="text-detail font-medium">
          {formatPercent(gainLossPercent)}
        </MonoValue>
      </p>
    </div>
  );
}
