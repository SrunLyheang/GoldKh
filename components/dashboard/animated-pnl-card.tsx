"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { formatPercent, formatUsd } from "@/lib/format/money";
import { toneFromAmount } from "@/lib/format/tone";
import { COUNT_UP_MS, SMOOTH_EASE } from "@/lib/ui/use-count-up";
import { cn } from "@/lib/utils";
import { MonoValue } from "./mono-value";
import { Panel } from "./panel";

// Unlike the other stat cards (which roll up from zero), the Unrealized
// Gain/Loss figure rolls from the value the user last saw — persisted in
// localStorage — to the new one, so on a refresh it visibly moves up or
// down from where the position was. First visit, an unchanged value, or
// prefers-reduced-motion render static. Colour tracks the value sign; the
// percent sub-line snaps.
const STORAGE_KEY = "goldkh-last-pnl";

export function AnimatedPnlCard({
  label,
  gainLossUsd,
  gainLossPercent,
}: {
  label: string;
  gainLossUsd: string;
  gainLossPercent: string;
}) {
  const reduceMotion = useReducedMotion();
  const current = Number(gainLossUsd);
  const tone = toneFromAmount(gainLossUsd);

  // Non-null only while a roll is in flight.
  const [rolling, setRolling] = useState<string | null>(null);

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

    if (
      previous === null ||
      previous === current ||
      !Number.isFinite(current) ||
      reduceMotion
    ) {
      persist();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRolling(null);
      return;
    }

    const controls = animate(previous, current, {
      duration: COUNT_UP_MS / 1000,
      ease: SMOOTH_EASE,
      onUpdate: (v) => setRolling(formatUsd(String(v))),
      onComplete: () => {
        setRolling(null);
        persist();
      },
    });
    return () => controls.stop();
  }, [gainLossUsd, current, reduceMotion]);

  const display = rolling ?? formatUsd(gainLossUsd);

  return (
    <Panel
      className={cn(
        tone === "gain" && "bg-state-gain/6 border-l-2 border-l-state-gain",
        tone === "loss" && "bg-destructive/6 border-l-2 border-l-destructive"
      )}
    >
      <p className="tt-label text-[11px] text-muted-foreground">{label}</p>
      <MonoValue tone={tone} signed className="mt-1.5 block text-[19px] font-semibold">
        {display}
      </MonoValue>
      <MonoValue tone={tone} signed className="mt-1 block text-[12px]">
        {formatPercent(gainLossPercent)}
      </MonoValue>
    </Panel>
  );
}
