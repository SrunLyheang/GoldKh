import { priceFromTroyOz } from "./units";

export interface PriceSnapshotLike {
  capturedAt: Date;
  pricePerTroyOz: string;
}

export interface ChartPoint {
  date: string;
  pricePerDamlung: number;
}

// Shapes raw price_snapshots rows into the series the chart renders —
// converted to price/damlung since that's the unit the dashboard's
// headline price is quoted in. Pure: no I/O, no Date.now().
export function buildDamlungPriceSeries(
  snapshots: PriceSnapshotLike[]
): ChartPoint[] {
  return snapshots.map((snap) => ({
    date: snap.capturedAt.toISOString(),
    pricePerDamlung: Number(priceFromTroyOz(snap.pricePerTroyOz, "damlung")),
  }));
}

// The spot price per damlung as of a `YYYY-MM-DD` transaction date: the
// newest chart point captured at or before the end of that day. `null`
// when no snapshot is that old (the history doesn't reach back far
// enough), which the row-detail view renders as "—". `points` is
// oldest-first, matching buildDamlungPriceSeries' output.
export function spotPerDamlungOnDate(
  points: ChartPoint[],
  dateKey: string
): number | null {
  const cutoff = `${dateKey}T23:59:59.999Z`;
  let match: number | null = null;
  for (const point of points) {
    if (point.date <= cutoff) match = point.pricePerDamlung;
    else break;
  }
  return match;
}
