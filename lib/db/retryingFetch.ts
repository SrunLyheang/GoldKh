// Transport-level retry for the Neon HTTP driver. The pooled free-tier
// endpoint suspends when idle; the first query after wake can fail with a
// network error or 5xx, and a retry a few hundred ms later succeeds.
// Without this, that blip rejects a whole `/dashboard` server render.
//
// Wired in via `neonConfig.fetchFunction` in ./client. Only transport
// failures retry (thrown fetch error, or status >= 500); status < 500 is
// returned untouched. A retry can re-run a statement whose response was
// lost; every writer is a conditional insert/upsert (no-op on repeat)
// except insertSnapshot, where the worst case is one duplicate price row.

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

export interface RetryingFetchOptions {
  // Total tries, not retries. 3 → up to two retries.
  maxAttempts?: number;
  // Backoff before retry N is baseDelayMs * N: 150ms, then 300ms.
  baseDelayMs?: number;
  // Per-attempt ceiling so a hung cold-start can't stall the render.
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
          // Caller signal wins; otherwise our timeout is the only abort source.
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
