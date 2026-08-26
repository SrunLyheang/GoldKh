// Applies to the transaction-mutating routes (POST /api/transactions,
// PATCH and DELETE /api/transactions/[id]) per progress-tracker.md's
// rate-limiting decision — hard block (429) once exceeded, keyed on
// Clerk user_id. Open public signup means these routes are now exposed
// to strangers, not just the developer.
//
// 20 requests per 5-minute window: generous for legitimate use (nobody
// adds/edits/deletes 20 transactions by hand in 5 minutes) while still
// stopping a scripted burst. Revisit if real usage turns out to hit it.
export const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
export const RATE_LIMIT_MAX_REQUESTS = 20;
