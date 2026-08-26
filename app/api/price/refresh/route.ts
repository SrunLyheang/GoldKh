import { auth } from "@clerk/nextjs/server";
import { apiError, apiOk } from "@/lib/api/response";
import {
  getLatestManualSnapshot,
  insertSnapshot,
  isManualCooldownActive,
} from "@/lib/price/getPrice";
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

  const latestManual = await getLatestManualSnapshot();
  if (isManualCooldownActive(latestManual)) {
    return apiError(
      "COOLDOWN",
      "Price was just refreshed — try again in a few minutes",
      429
    );
  }

  try {
    const price = await fetchGoldapiPrice();
    const inserted = await insertSnapshot(price, { manual: true });
    return apiOk(inserted);
  } catch {
    return apiError(
      "PROVIDER_ERROR",
      "Couldn't reach the price provider — try again shortly",
      502
    );
  }
}
