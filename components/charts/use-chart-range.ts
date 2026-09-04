"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MergedRow } from "./detailed-chart";

// The visible-window state machine for DetailedChart: which slice of `rows`
// is on screen, the range presets, and the drag-to-pan gesture. Pulled out
// of the chart component because every recent chart bug lived in how these
// pieces interact (the imperative touch listeners, the `rows.length < 2`
// early return, index clamping on data growth) — and none of it was
// reachable from a test while it sat inline in the render body.

export const PRESET_WINDOWS_MS = {
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "3M": 90 * 24 * 60 * 60 * 1000,
} as const;

export type PresetKey = keyof typeof PRESET_WINDOWS_MS | "All";

export const PRESET_ORDER: PresetKey[] = ["1W", "1M", "3M", "All"];

// [startIndex, endIndex] into `rows` for a preset window ending now. "All" or
// any window past the earliest datum clamps to the full range — no backfill.
export function presetRange(
  rows: MergedRow[],
  preset: PresetKey,
  now: number = Date.now(),
): [number, number] {
  const lastIndex = Math.max(0, rows.length - 1);
  if (preset === "All" || rows.length === 0) {
    return [0, lastIndex];
  }
  const cutoff = now - PRESET_WINDOWS_MS[preset];
  if (cutoff <= rows[0].t) {
    return [0, lastIndex];
  }
  const start = rows.findIndex((row) => row.t >= cutoff);
  return [start < 0 ? lastIndex : start, lastIndex];
}

// True when a preset's window already spans the whole dataset (same as
// "All") — the full-mode UI disables that button.
export function presetCoversAll(
  rows: MergedRow[],
  preset: PresetKey,
  now: number = Date.now(),
): boolean {
  if (preset === "All" || rows.length === 0) {
    return true;
  }
  return now - PRESET_WINDOWS_MS[preset] <= rows[0].t;
}

// The drag-to-pan math, pure so it can be driven with synthetic deltas in a
// test. `dx` is the horizontal drag distance in px; the window shifts by the
// same fraction of its own span, then slides back inside [0, lastIndex]
// without changing width.
export function panWindow(
  dx: number,
  start: number,
  end: number,
  lastIndex: number,
  plotWidth: number,
): [number, number] {
  const span = end - start;
  const plot = Math.max(1, plotWidth - 64); // minus y-axis (56) + right margin (8)
  const shift = Math.round((-dx / plot) * span);
  let ns = start + shift;
  let ne = end + shift;
  if (ns < 0) {
    ne -= ns;
    ns = 0;
  }
  if (ne > lastIndex) {
    ns -= ne - lastIndex;
    ne = lastIndex;
  }
  return [ns, ne];
}

export interface ChartRange {
  startIndex: number;
  endIndex: number;
  isZoomed: boolean;
  activePreset: PresetKey | null;
  plotWidth: number;
  setPlotWidth: (w: number) => void;
  plotBoxRef: React.RefObject<HTMLDivElement | null>;
  applyPreset: (preset: PresetKey) => void;
  resetZoom: () => void;
  onBrushChange: (next: { startIndex?: number; endIndex?: number }) => void;
}

export function useChartRange(rows: MergedRow[]): ChartRange {
  const lastIndex = Math.max(0, rows.length - 1);

  // Recharts 3's <Brush> divides by the plot width to place its travellers;
  // on first mount ResponsiveContainer briefly reports width 0 before its
  // ResizeObserver fires. The chart gates the Brush on a sane width; the
  // pan gesture needs it to translate px into index shifts.
  const [plotWidth, setPlotWidth] = useState(0);

  const [range, setRange] = useState<[number, number] | null>(null);
  const [activePreset, setActivePreset] = useState<PresetKey | null>("All");

  // "All" always tracks the live data length, so a snapshot landing
  // mid-session widens the window instead of leaving it pinned to a stale
  // end index. A held preset window only re-slices on an explicit click.
  const [rawStart, rawEnd] =
    activePreset === "All" ? [0, lastIndex] : (range ?? [0, lastIndex]);
  const startIndex = Math.min(Math.max(0, rawStart), lastIndex);
  const endIndex = Math.min(Math.max(startIndex, rawEnd), lastIndex);
  const isZoomed = startIndex > 0 || endIndex < lastIndex;

  const plotBoxRef = useRef<HTMLDivElement>(null);
  // A ref mirror of the live window so the imperative listeners below read
  // current values without re-binding on every render.
  const panLive = useRef({ startIndex, endIndex, lastIndex, plotWidth });
  useEffect(() => {
    panLive.current = { startIndex, endIndex, lastIndex, plotWidth };
  });

  useEffect(() => {
    const el = plotBoxRef.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    let s = 0;
    let e0 = 0;
    let on = false;
    let axis: "?" | "x" | "y" = "?";
    const onStart = (ev: TouchEvent) => {
      const target = ev.target as Element;
      if (ev.touches.length !== 1 || target.closest?.(".recharts-brush"))
        return;
      const { startIndex: si, endIndex: ei } = panLive.current;
      if (si <= 0 && ei >= panLive.current.lastIndex) return; // not zoomed
      sx = ev.touches[0].clientX;
      sy = ev.touches[0].clientY;
      s = si;
      e0 = ei;
      on = true;
      axis = "?";
    };
    const onMove = (ev: TouchEvent) => {
      if (!on) return;
      const dx = ev.touches[0].clientX - sx;
      const dy = ev.touches[0].clientY - sy;
      if (axis === "?") {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis !== "x") return;
      ev.preventDefault();
      const { lastIndex: li, plotWidth: pw } = panLive.current;
      setRange(panWindow(dx, s, e0, li, pw));
      setActivePreset(null);
    };
    const onEnd = () => {
      on = false;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
    // Re-run once rows reach chartable length so listeners attach to the plot
    // element, which only renders past the chart's `rows.length < 2` return.
  }, [rows.length]);

  return useMemo(
    () => ({
      startIndex,
      endIndex,
      isZoomed,
      activePreset,
      plotWidth,
      setPlotWidth,
      plotBoxRef,
      applyPreset(preset: PresetKey) {
        setActivePreset(preset);
        setRange(presetRange(rows, preset));
      },
      resetZoom() {
        setActivePreset("All");
        setRange(null);
      },
      onBrushChange(next: { startIndex?: number; endIndex?: number }) {
        if (
          typeof next.startIndex === "number" &&
          typeof next.endIndex === "number"
        ) {
          setRange([next.startIndex, next.endIndex]);
          setActivePreset(null);
        }
      },
    }),
    [rows, startIndex, endIndex, isZoomed, activePreset, plotWidth],
  );
}
