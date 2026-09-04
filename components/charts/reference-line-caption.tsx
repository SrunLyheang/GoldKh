import { formatUsd } from "@/lib/format/money";
import { t } from "@/lib/i18n/dictionary";
import type { RefPlacement } from "./chart-model";

// The line-legend caption under a DetailedChart: a dashed-rule swatch in
// the reference line's colour, then what that line marks. Shared by the
// dashboard's compact price chart and the full /dashboard/price view so
// the wording — and the on-scale vs. pinned-to-edge branch — lives once.
// No "use client": plain render, safe in a server tree.
export function ReferenceLineCaption({
  placed,
}: {
  placed: { actual: number; placement: RefPlacement };
}) {
  const amount = `${formatUsd(String(placed.actual))}/damlung`;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-detail text-muted-foreground">
      <span
        aria-hidden
        className="inline-block w-4 shrink-0 border-t border-dashed border-(--muted-foreground)"
      />
      {placed.placement === "on-scale"
        ? `${t.chart.averageCost} — ${amount}`
        : `${t.chart.averageCost} — ${amount}, ${
            placed.placement === "above" ? "above" : "below"
          } this range (line shown at the edge)`}
    </p>
  );
}
