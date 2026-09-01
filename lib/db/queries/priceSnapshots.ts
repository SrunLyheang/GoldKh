import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { priceSnapshots } from "@/lib/db/schema";

// One `price_snapshots` row, trimmed to the four columns the price layer and
// dashboard read (the raw row also has `isManual`, used only by
// listRecentPriceSnapshots).
export interface PriceSnapshot {
  id: string;
  pricePerTroyOz: string;
  source: string;
  capturedAt: Date;
}

// Input for recording a new snapshot. Declared locally (not imported from
// `lib/price/providers`) to keep the dependency direction price → db.
export interface NewPriceSnapshot {
  pricePerTroyOz: string;
  source: string;
}

// Newest snapshot of any kind. Lets the refresh route and dashboard check
// price age without getPrice(), which can trigger a provider fetch.
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

// Atomic conditional insert (not an advisory lock). WHERE NOT EXISTS makes
// this a no-op (returns undefined) if a concurrent request already wrote a
// fresh row. `staleMs` is collapsed to a cutoff timestamp so there's no SQL
// interval literal to keep synced with the JS constant.
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

// Unconditional insert, only for the manual-refresh route (it runs its own
// cooldown check first, so no guard is needed). Kept separate from
// insertSnapshotIfStale so that atomic statement stays intact.
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

// price_snapshots is append-only, gaining a row only on a lazy refresh (no
// cron, no backfill), so points cluster around traffic. Oldest-first for charting.
export async function listRecentPriceSnapshots(limit = 200) {
  const rows = await db
    .select()
    .from(priceSnapshots)
    .orderBy(desc(priceSnapshots.capturedAt))
    .limit(limit);
  return rows.sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
}
