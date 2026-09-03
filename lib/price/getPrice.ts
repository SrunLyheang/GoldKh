import { PRICE_STALENESS_MS } from "@/lib/constants/staleness";
import {
  getLatestSnapshot,
  insertSnapshotIfStale,
  type NewPriceSnapshot,
  type PriceSnapshot,
} from "@/lib/db/queries/priceSnapshots";
import { priceFreshness } from "./freshness";
import { isMarketOpen } from "./marketHours";
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
  isMarketOpen: () => boolean;
}

const defaultDeps: GetPriceDeps = {
  getLatestSnapshot,
  insertSnapshotIfStale,
  providers: PROVIDERS,
  isMarketOpen,
};

// Reads newest, checks age, returns if fresh — otherwise walks the
// provider list, inserts, returns. Falls back to the last cached price
// on total provider failure (CONTEXT.md invariant 8 — "always a price"),
// and only throws when there is no cache to fall back to at all.
export async function getPrice(
  deps: GetPriceDeps = defaultDeps
): Promise<PriceSnapshot> {
  // A transient failure reading the cache (Neon cold start, network blip —
  // ./db/retryingFetch already retries these at the transport layer) must
  // not take down the page. Treat it as "no cache": fall through to the
  // provider list below, and if that also fails with nothing cached, the
  // final throw stands.
  let latest: PriceSnapshot | undefined;
  try {
    latest = await deps.getLatestSnapshot();
  } catch {
    latest = undefined;
  }
  // When the spot market is closed the price cannot have moved, so any
  // cached snapshot is served as-is however stale — no goldapi.io request
  // is spent on a weekend. With no cache at all we still fall through to
  // the providers below: a first-ever price beats an empty dashboard.
  if (latest && (!deps.isMarketOpen() || !priceFreshness(latest).isStale)) {
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
