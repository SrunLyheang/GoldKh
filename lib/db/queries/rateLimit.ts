import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { rateLimitCounters } from "@/lib/db/schema";
import { RATE_LIMIT_WINDOW_MS } from "@/lib/constants/rateLimit";

// Atomic Postgres upsert, not a check-then-write in JS — the database
// arbitrates concurrency (code-standards.md), same pattern getPrice()'s
// conditional insert follows. windowStart is floored to
// RATE_LIMIT_WINDOW_MS boundaries using the app clock (matching
// isManualCooldownActive's Date.now()-based approach in
// lib/price/getPrice.ts), so every request in the same window computes
// the same primary key and the ON CONFLICT branch increments a shared
// row instead of racing to insert separate ones.
export async function incrementRequestCount(userId: string): Promise<number> {
  const windowStart = new Date(
    Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS
  );

  const [row] = await db
    .insert(rateLimitCounters)
    .values({ userId, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimitCounters.userId, rateLimitCounters.windowStart],
      set: { count: sql`${rateLimitCounters.count} + 1` },
    })
    .returning({ count: rateLimitCounters.count });

  return row.count;
}
