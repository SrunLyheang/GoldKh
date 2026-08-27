import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { priceSnapshots } from "@/lib/db/schema";

// The shape every read here returns: one row of `price_snapshots`, the
// "price snapshot" of CONTEXT.md. Kept to the four columns the price layer
// and dashboard actually read — the raw Drizzle row also carries
// `isManual`, which only `listRecentPriceSnapshots` needs.
export interface PriceSnapshot {
  id: string;
  pricePerTroyOz: string;
  source: string;
  capturedAt: Date;
}

// What a caller hands in to record a new snapshot — the normalized price
// plus its provider. Declared locally rather than imported from
// `lib/price/providers`, so the dependency arrow stays price → db.
export interface NewPriceSnapshot {
  pricePerTroyOz: string;
  source: string;
}

// Newest snapshot of any kind. The manual-refresh route and the dashboard
// both gate on "how old is the newest price we have" without running
// getPrice() (which can trigger a provider fetch as a side effect).
export async function getLatestSnapshot(): Promise<PriceSnapshot | undefined> {
  const [latest] = await db
    .select()
    .from(priceSnapshots)
    .orderBy(desc(priceSnapshots.capturedAt))
    .limit(1);
  return latest;
}

interface RawSnapshotRow {
  id: string;
  pricePerTroyOz: string;
  source: string;
  capturedAt: string;
}

// Conditional insert, not an advisory lock — see progress-tracker.md's
// concurrency guard decision. If a concurrent request already inserted a
// fresh row between our staleness check and this insert, the WHERE NOT
// EXISTS clause makes this a no-op (returns undefined) instead of writing
// a redundant row. `staleMs` comes from the caller (PRICE_STALENESS_MS),
// collapsed to a bound cutoff timestamp so there is no SQL interval
// literal to keep hand-synced with the JS constant.
export async function insertSnapshotIfStale(
  price: NewPriceSnapshot,
  staleMs: number
): Promise<PriceSnapshot | undefined> {
  const cutoff = new Date(Date.now() - staleMs);
  const result = await db.execute(sql`
    INSERT INTO price_snapshots (price_per_troy_oz, source)
    SELECT ${price.pricePerTroyOz}, ${price.source}
    WHERE NOT EXISTS (
      SELECT 1 FROM price_snapshots
      WHERE captured_at > ${cutoff}
    )
    RETURNING id, price_per_troy_oz AS "pricePerTroyOz", source, captured_at AS "capturedAt"
  `);
  const row = result.rows[0] as unknown as RawSnapshotRow | undefined;
  if (!row) {
    return undefined;
  }
  return { ...row, capturedAt: new Date(row.capturedAt) };
}

// Unconditional insert used only by the manual-refresh route — that route
// runs its own cooldown check (getLatestSnapshot + priceFreshness) before
// calling this, so no WHERE NOT EXISTS guard is needed. Kept separate from
// insertSnapshotIfStale's atomic conditional insert rather than sharing
// it: splitting that single statement into a check-then-insert would
// reopen the race the conditional insert exists to close.
export async function insertSnapshot(
  price: NewPriceSnapshot,
  opts?: { manual?: boolean }
): Promise<PriceSnapshot> {
  const [row] = await db
    .insert(priceSnapshots)
    .values({
      pricePerTroyOz: price.pricePerTroyOz,
      source: price.source,
      isManual: opts?.manual ?? false,
    })
    .returning();
  return row;
}

// price_snapshots is append-only and only gains a row when a request finds
// the cache stale (lazy refresh, not a cron) — see progress-tracker.md.
// Points are clustered around traffic and have gaps wherever nobody loaded
// the dashboard; there is no backfill. Returned oldest-first for charting.
export async function listRecentPriceSnapshots(limit = 200) {
  const rows = await db
    .select()
    .from(priceSnapshots)
    .orderBy(desc(priceSnapshots.capturedAt))
    .limit(limit);
  return rows.sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
}
