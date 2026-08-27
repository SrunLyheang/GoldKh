import { auth } from "@clerk/nextjs/server";
import { apiError, apiOk } from "@/lib/api/response";
import {
  getLatestSnapshot,
  insertSnapshot,
} from "@/lib/db/queries/priceSnapshots";
import { priceFreshness } from "@/lib/price/freshness";
import { fetchGoldapiPrice } from "@/lib/price/providers/goldapi";

// Bypasses getPrice()'s 30-minute staleness cache on purpose — this route
// exists specifically for a user who wants a real, current price right
// now. The cooldown below is what protects goldapi.io's free-tier quota
// instead.
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return apiError("UNAUTHORIZED", "Sign in required", 401);
  }

  // Gate on the newest snapshot of any kind, not just prior manual refreshes:
  // if a page load already pulled a fresh price via getPrice(), a manual
  // refresh right after it would be a redundant provider call.
  const freshness = priceFreshness(await getLatestSnapshot());
  if (freshness.cooldownActive) {
    const res = apiError(
      "COOLDOWN",
      "Price was just refreshed — try again in a few minutes",
      429
    );
    // Standard header rather than a data field on the error envelope
    // (code-standards.md keeps error responses to { code, message }). The
    // client reads this instead of guessing the deadline from Date.now().
    res.headers.set(
      "Retry-After",
      String(Math.max(1, Math.ceil((freshness.cooldownEndsAt! - Date.now()) / 1000)))
    );
    return res;
  }

  try {
    const price = await fetchGoldapiPrice();
    const inserted = await insertSnapshot(price, { manual: true });
    // cooldownEndsAt travels in the payload so the client never recomputes
    // it from the capture timestamp and the constant.
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
}
