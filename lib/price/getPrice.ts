import { PRICE_STALENESS_MS } from "@/lib/constants/staleness";
import {
  getLatestSnapshot,
  insertSnapshotIfStale,
  type NewPriceSnapshot,
  type PriceSnapshot,
} from "@/lib/db/queries/priceSnapshots";
import { priceFreshness } from "./freshness";
import { fetchGoldapiPrice, type NormalizedPrice } from "./providers/goldapi";

// Re-exported so freshness.ts and callers that only speak the price layer
// don't need to reach into lib/db/queries for the row shape.
export type { PriceSnapshot };

const PROVIDERS: Array<() => Promise<NormalizedPrice>> = [fetchGoldapiPrice];

export interface GetPriceDeps {
  getLatestSnapshot: () => Promise<PriceSnapshot | undefined>;
  insertSnapshotIfStale: (
    price: NewPriceSnapshot,
    staleMs: number
  ) => Promise<PriceSnapshot | undefined>;
  providers: Array<() => Promise<NormalizedPrice>>;
}

const defaultDeps: GetPriceDeps = {
  getLatestSnapshot,
  insertSnapshotIfStale,
  providers: PROVIDERS,
};

// Reads newest, checks age, returns if fresh — otherwise walks the
// provider list, inserts, returns. Falls back to the last cached price
// on total provider failure (project-overview.md success criterion 3),
// and only throws when there is no cache to fall back to at all.
export async function getPrice(
  deps: GetPriceDeps = defaultDeps
): Promise<PriceSnapshot> {
  const latest = await deps.getLatestSnapshot();
  if (latest && !priceFreshness(latest).isStale) {
    return latest;
  }

  for (const provider of deps.providers) {
    try {
      const price = await provider();
      const inserted = await deps.insertSnapshotIfStale(price, PRICE_STALENESS_MS);
      if (inserted) {
        return inserted;
      }
      const refreshed = await deps.getLatestSnapshot();
      if (refreshed) {
        return refreshed;
      }
    } catch {
      continue;
    }
  }

  if (latest) {
    return latest;
  }

  throw new Error("All price providers failed and no cached price exists");
}
