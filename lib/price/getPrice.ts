import { desc, sql as drizzleSql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { priceSnapshots } from "@/lib/db/schema";
import { PRICE_STALENESS_MS } from "@/lib/constants/staleness";
import { fetchGoldapiPrice, type NormalizedPrice } from "./providers/goldapi";

export interface PriceResult {
  id: string;
  pricePerTroyOz: string;
  source: string;
  capturedAt: Date;
}

async function getLatestSnapshot(): Promise<PriceResult | undefined> {
  const [latest] = await db
    .select()
    .from(priceSnapshots)
    .orderBy(desc(priceSnapshots.capturedAt))
    .limit(1);
  return latest;
}

// Conditional insert, not an advisory lock — see progress-tracker.md's
// concurrency guard decision. If a concurrent request already inserted a
// fresh row between our staleness check and this insert, the WHERE NOT
// EXISTS clause makes this a no-op instead of writing a redundant row.
// The 30-minute literal below must match PRICE_STALENESS_MS — SQL can't
// reference the JS constant directly.
interface RawSnapshotRow {
  id: string;
  pricePerTroyOz: string;
  source: string;
  capturedAt: string;
}

async function insertIfStillStale(
  price: NormalizedPrice
): Promise<PriceResult | undefined> {
  const result = await db.execute(drizzleSql`
    INSERT INTO price_snapshots (price_per_troy_oz, source)
    SELECT ${price.pricePerTroyOz}, ${price.source}
    WHERE NOT EXISTS (
      SELECT 1 FROM price_snapshots
      WHERE captured_at > now() - interval '30 minutes'
    )
    RETURNING id, price_per_troy_oz AS "pricePerTroyOz", source, captured_at AS "capturedAt"
  `);
  const row = result.rows[0] as unknown as RawSnapshotRow | undefined;
  if (!row) {
    return undefined;
  }
  return { ...row, capturedAt: new Date(row.capturedAt) };
}

const PROVIDERS: Array<() => Promise<NormalizedPrice>> = [fetchGoldapiPrice];

export interface GetPriceDeps {
  getLatestSnapshot: () => Promise<PriceResult | undefined>;
  insertIfStillStale: (
    price: NormalizedPrice
  ) => Promise<PriceResult | undefined>;
  providers: Array<() => Promise<NormalizedPrice>>;
}

const defaultDeps: GetPriceDeps = {
  getLatestSnapshot,
  insertIfStillStale,
  providers: PROVIDERS,
};

function isFresh(snapshot: PriceResult): boolean {
  return Date.now() - snapshot.capturedAt.getTime() < PRICE_STALENESS_MS;
}

// Exposed so the dashboard can render a stale-price treatment without
// calling Date.now() directly inside a component body (React's purity
// rule flags impure calls there).
export function isSnapshotStale(snapshot: Pick<PriceResult, "capturedAt">): boolean {
  return Date.now() - snapshot.capturedAt.getTime() > PRICE_STALENESS_MS;
}

// Reads newest, checks age, returns if fresh — otherwise walks the
// provider list, inserts, returns. Falls back to the last cached price
// on total provider failure (project-overview.md success criterion 3),
// and only throws when there is no cache to fall back to at all.
export async function getPrice(
  deps: GetPriceDeps = defaultDeps
): Promise<PriceResult> {
  const latest = await deps.getLatestSnapshot();
  if (latest && isFresh(latest)) {
    return latest;
  }

  for (const provider of deps.providers) {
    try {
      const price = await provider();
      const inserted = await deps.insertIfStillStale(price);
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
