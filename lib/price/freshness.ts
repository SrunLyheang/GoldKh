import {
  MANUAL_REFRESH_COOLDOWN_MS,
  PRICE_STALENESS_MS,
} from "@/lib/constants/staleness";
import type { PriceSnapshot } from "./getPrice";

// The derived view of a price snapshot's age — see CONTEXT.md, "price
// freshness". Every call site that used to re-run `Date.now() - capturedAt`
// against one of the staleness constants now reads a field off this instead:
// the dashboard for its stale treatment, the manual-refresh route for its
// 429 decision and Retry-After header, and getPrice() for whether the cache
// can be served without a provider call.
export interface PriceFreshness {
  // Newest price is old enough that the dashboard shows a stale treatment
  // and getPrice() should try the provider list again. At exactly
  // PRICE_STALENESS_MS this is true — refetching at the boundary is the safe
  // direction.
  isStale: boolean;
  // A manual refresh right now would be a redundant provider call, because
  // the newest snapshot (however it was captured) is younger than the
  // cooldown window.
  cooldownActive: boolean;
  // Epoch ms when the cooldown lifts. Non-null exactly when cooldownActive —
  // the dashboard passes it to RefreshButton, the route turns it into a
  // Retry-After header.
  cooldownEndsAt: number | null;
}

export function priceFreshness(
  snapshot: Pick<PriceSnapshot, "capturedAt"> | undefined,
  now: number = Date.now()
): PriceFreshness {
  // No snapshot at all (empty price_snapshots): nothing to be fresh, nothing
  // to cool down. isStale is true so getPrice() falls through to a provider.
  if (!snapshot) {
    return { isStale: true, cooldownActive: false, cooldownEndsAt: null };
  }

  const capturedAtMs = snapshot.capturedAt.getTime();
  const age = now - capturedAtMs;
  const cooldownActive = age < MANUAL_REFRESH_COOLDOWN_MS;

  return {
    isStale: age >= PRICE_STALENESS_MS,
    cooldownActive,
    cooldownEndsAt: cooldownActive
      ? capturedAtMs + MANUAL_REFRESH_COOLDOWN_MS
      : null,
  };
}
