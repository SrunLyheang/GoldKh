import { getSnapshotAtOrBefore } from "@/lib/db/queries/priceSnapshots";
import { priceFreshness } from "@/lib/price/freshness";
import { getPrice } from "@/lib/price/getPrice";
import { isMarketOpen } from "@/lib/price/marketHours";
import { buildLandingQuote, type LandingQuote } from "./quote";

const DAY_MS = 24 * 60 * 60 * 1000;

// The landing page's one read: the same cached spot price the dashboard
// uses (getPrice — CONTEXT.md invariant 8, "always a price"), plus two
// older snapshots for "since yesterday" and the worked example. Returns
// null only when there is no price at all (empty cache and every
// provider down); the page then says so instead of showing a number.
// The older snapshots are optional extras — their failure never hides
// the price.
export async function loadLandingQuote(now = new Date()): Promise<LandingQuote | null> {
  let latest;
  try {
    latest = await getPrice();
  } catch {
    return null;
  }

  const [yesterday, past] = await Promise.all([
    getSnapshotAtOrBefore(new Date(now.getTime() - DAY_MS)).catch(() => undefined),
    // Prefer a month back; a younger database falls back to a week back.
    getSnapshotAtOrBefore(new Date(now.getTime() - 30 * DAY_MS))
      .then((row) => row ?? getSnapshotAtOrBefore(new Date(now.getTime() - 7 * DAY_MS)))
      .catch(() => undefined),
  ]);

  return buildLandingQuote({
    latest,
    isStale: priceFreshness(latest, now.getTime()).isStale,
    marketOpen: isMarketOpen(),
    yesterday: yesterday ?? null,
    past: past ?? null,
    now,
  });
}
