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
