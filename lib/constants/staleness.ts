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
// shared goldapi.io quota. 5 minutes trades a larger slice of the
// 100/month free-tier quota for a button that feels responsive; if usage
// grows enough to threaten the quota, raise this back toward 10 minutes
// rather than removing the cooldown.
export const MANUAL_REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
