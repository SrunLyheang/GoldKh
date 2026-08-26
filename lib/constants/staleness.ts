// How old a cached price_snapshots row can be before getPrice() treats it
// as stale and tries the provider list again.
// 30 minutes, not 5 — goldapi.io's free tier caps at 100 requests/month.
// At 5 minutes, leaving the dashboard open continuously could burn through
// the whole month's quota in under a day. 30 minutes cuts worst-case call
// volume 6x while still refreshing several times during a normal session.
// If the free tier is exceeded anyway, getPrice() falls back to the last
// cached price rather than failing — see progress-tracker.md.
export const PRICE_STALENESS_MS = 30 * 60 * 1000;

// Minimum gap between user-triggered manual refreshes (POST
// /api/price/refresh), enforced globally, not per-user — there's one
// shared price feed, so a global cooldown is what actually protects the
// shared goldapi.io quota. 10 minutes caps worst-case manual-triggered
// call volume to a low multiple of the ~48/day the 30-minute automatic
// staleness check already allows, while still feeling responsive to a
// user who wants a price right now.
export const MANUAL_REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
