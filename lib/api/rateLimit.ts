import { RATE_LIMIT_MAX_REQUESTS } from "@/lib/constants/rateLimit";
import { incrementRequestCount } from "@/lib/db/queries/rateLimit";

// Returns true once a user has exceeded RATE_LIMIT_MAX_REQUESTS within
// the current window. Increments unconditionally on every call — a
// blocked request still counts against the window, which is what keeps
// the block in effect for the rest of it rather than flapping open and
// shut at the threshold.
export async function isRateLimited(userId: string): Promise<boolean> {
  const count = await incrementRequestCount(userId);
  return count > RATE_LIMIT_MAX_REQUESTS;
}
