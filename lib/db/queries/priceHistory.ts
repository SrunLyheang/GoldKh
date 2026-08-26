import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { priceSnapshots } from "@/lib/db/schema";

// price_snapshots is append-only and only gains a row when a request
// finds the cache stale (lazy refresh, not a cron) — see
// progress-tracker.md. Points are clustered around traffic and have
// gaps wherever nobody loaded the dashboard; there is no backfill.
export async function listRecentPriceSnapshots(limit = 200) {
  const rows = await db
    .select()
    .from(priceSnapshots)
    .orderBy(desc(priceSnapshots.capturedAt))
    .limit(limit);
  return rows.sort(
    (a, b) => a.capturedAt.getTime() - b.capturedAt.getTime()
  );
}
