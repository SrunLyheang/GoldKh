import * as Sentry from "@sentry/nextjs";
import { apiError, apiOk } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/api/sameOrigin";
import { withAuthAndRateLimit } from "@/lib/api/withAuthAndRateLimit";
import {
  getLatestSnapshot,
  insertSnapshot,
} from "@/lib/db/queries/priceSnapshots";
import { priceFreshness } from "@/lib/price/freshness";
import { isMarketOpen } from "@/lib/price/marketHours";
import { fetchGoldapiPrice } from "@/lib/price/providers/goldapi";

// Deliberately bypasses getPrice()'s staleness cache — this route exists for
// a user who wants a current price now.
//
// Two layers protect goldapi.io's 100/month quota:
//   - the global manual-refresh cooldown below (one shared price feed);
//   - `withAuthAndRateLimit`'s per-user window, which caps how many
//     requests a single user can fire while the cooldown check and the
//     insert are still racing. Without it, N concurrent requests from one
//     tab all observe `cooldownEndsAt === null` at the boundary and all
//     hit the provider.
export const POST = withAuthAndRateLimit(async (request) => {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  // The spot market is closed on weekends — goldapi.io would only echo
  // Friday's close, so don't spend a request on it. The dashboard already
  // disables the button in this state; this guards a tab left open across
  // the weekend boundary.
  if (!isMarketOpen()) {
    return apiError(
      "MARKET_CLOSED",
      "Market's closed — prices resume Monday",
      409
    );
  }

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
  } catch (error) {
    // The provider failing is the one path here that is worth an alert —
    // it means the quota is exhausted or goldapi.io is down. Swallowing it
    // silently (as before) hid both.
    Sentry.captureException(error);
    return apiError(
      "PROVIDER_ERROR",
      "Couldn't reach the price provider — try again shortly",
      502
    );
  }
});
