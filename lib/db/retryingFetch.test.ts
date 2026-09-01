import { describe, expect, it, vi } from "vitest";
import { createRetryingFetch } from "./retryingFetch";

const noSleep = () => Promise.resolve();

function response(status: number): Response {
  return new Response(status >= 400 ? "err" : "ok", { status });
}

describe("createRetryingFetch", () => {
  it("returns the first response when it succeeds", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(200));
    const retrying = createRetryingFetch({ fetchImpl, sleep: noSleep });

    const res = await retrying("https://db/sql");

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("retries a thrown transport error and succeeds on a later attempt", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValue(response(200));
    const retrying = createRetryingFetch({ fetchImpl, sleep: noSleep });

    const res = await retrying("https://db/sql");

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries a 5xx response then returns the eventual success", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response(503))
      .mockResolvedValue(response(200));
    const retrying = createRetryingFetch({ fetchImpl, sleep: noSleep });

    const res = await retrying("https://db/sql");

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 4xx response — a SQL error must surface immediately", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(400));
    const retrying = createRetryingFetch({ fetchImpl, sleep: noSleep });

    const res = await retrying("https://db/sql");

    expect(res.status).toBe(400);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("rethrows the last error after exhausting every attempt", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const retrying = createRetryingFetch({
      fetchImpl,
      sleep: noSleep,
      maxAttempts: 3,
    });

    await expect(retrying("https://db/sql")).rejects.toThrow("fetch failed");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("returns a 5xx unretried once it is the final attempt", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(500));
    const retrying = createRetryingFetch({
      fetchImpl,
      sleep: noSleep,
      maxAttempts: 2,
    });

    const res = await retrying("https://db/sql");

    expect(res.status).toBe(500);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("aborts an attempt that exceeds the timeout and retries it", async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi
        .fn()
        .mockImplementationOnce(
          (_input, init: RequestInit) =>
            new Promise((_resolve, reject) => {
              init.signal?.addEventListener("abort", () =>
                reject(new DOMException("aborted", "AbortError"))
              );
            })
        )
        .mockResolvedValue(response(200));
      const retrying = createRetryingFetch({
        fetchImpl,
        sleep: noSleep,
        timeoutMs: 1_000,
      });

      const promise = retrying("https://db/sql");
      await vi.advanceTimersByTimeAsync(1_000);
      const res = await promise;

      expect(res.status).toBe(200);
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
