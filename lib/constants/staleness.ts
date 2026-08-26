// How old a cached price_snapshots row can be before getPrice() treats it
// as stale and tries the provider list again.
export const PRICE_STALENESS_MS = 5 * 60 * 1000;
