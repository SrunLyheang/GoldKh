import { apiError, apiOk } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuthAndRateLimit";
import {
  getLatestSnapshot,
  insertSnapshot,
} from "@/lib/db/queries/priceSnapshots";
import { priceFreshness } from "@/lib/price/freshness";
import { fetchGoldapiPrice } from "@/lib/price/providers/goldapi";

// Deliberately bypasses getPrice()'s staleness cache — this route exists for
// a user who wants a current price now. The manual-refresh cooldown below,
// not the per-user request limiter, is what protects the provider quota.
export const POST = withAuth(async () => {
  // Gate on the newest snapshot of any kind, so a manual refresh right after
  // a page load that already pulled a fresh price is a no-op.
  const { cooldownEndsAt } = priceFreshness(await getLatestSnapshot());
  if (cooldownEndsAt !== null) {
    const res = apiError(
      "COOLDOWN",
      "Price was just refreshed — try again in a few minutes",
      429
    );
    const retryAfter = Math.max(
      1,
      Math.ceil((cooldownEndsAt - Date.now()) / 1000)
    );
    res.headers.set("Retry-After", String(retryAfter));
    return res;
  }

  try {
    const price = await fetchGoldapiPrice();
    const inserted = await insertSnapshot(price, { manual: true });
    return apiOk({
      ...inserted,
      cooldownEndsAt: priceFreshness(inserted).cooldownEndsAt,
    });
  } catch {
    return apiError(
      "PROVIDER_ERROR",
      "Couldn't reach the price provider — try again shortly",
      502
    );
  }
});
