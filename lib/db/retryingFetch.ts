// Transport-level retry for the Neon HTTP driver. The pooled free-tier
// endpoint suspends when idle; the first query after it wakes can fail with
// a network error ("fetch failed") or a 5xx before the pool is ready, and a
// second attempt a few hundred milliseconds later succeeds. Without this,
// that one-off blip rejects a whole `/dashboard` server render even though
// cached data is a retry away.
//
// Wired in through `neonConfig.fetchFunction` in ./client, so every request
// drizzle's neon-http driver makes passes through here. Only transport
// failures are retried: a thrown fetch error, or a response with status
// >= 500. A status < 500 (e.g. 400 for a SQL error) is returned untouched
// so drizzle surfaces it exactly as before. A retry can re-run a statement
// whose response was lost in flight; every writer in lib/db/queries is a
// conditional insert or an upsert, so a repeat is a no-op — except
// insertSnapshot's unconditional manual-refresh insert, where the worst
// case is one duplicate price row.

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

export interface RetryingFetchOptions {
  // Total tries, not retries-after-the-first. 3 → up to two retries.
  maxAttempts?: number;
  // Backoff before retry N is baseDelayMs * N: 150ms, then 300ms.
  baseDelayMs?: number;
  // Per-attempt ceiling so a hung cold-start connection can't stall the
  // render indefinitely.
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 150;
const DEFAULT_TIMEOUT_MS = 10_000;

export function createRetryingFetch(
  options: RetryingFetchOptions = {}
): typeof fetch {
  const {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
    sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = options;

  async function retryingFetch(
    input: FetchInput,
    init?: FetchInit
  ): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(input, {
          ...init,
          // Respect a caller-supplied signal if there is one; otherwise our
          // timeout is the only abort source.
          signal: init?.signal ?? controller.signal,
        });
        if (response.status >= 500 && attempt < maxAttempts) {
          lastError = new Error(`Neon HTTP ${response.status}`);
          await sleep(baseDelayMs * attempt);
          continue;
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt >= maxAttempts) break;
        await sleep(baseDelayMs * attempt);
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError;
  }

  return retryingFetch as typeof fetch;
}
