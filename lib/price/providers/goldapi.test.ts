import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGoldapiPrice, GOLDAPI_SOURCE } from "./goldapi";

describe("fetchGoldapiPrice", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GOLDAPI_IO_API_KEY;

  beforeEach(() => {
    process.env.GOLDAPI_IO_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GOLDAPI_IO_API_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it("throws when no API key is configured", async () => {
    delete process.env.GOLDAPI_IO_API_KEY;
    await expect(fetchGoldapiPrice()).rejects.toThrow(
      "GOLDAPI_IO_API_KEY is not set"
    );
  });

  it("returns a normalized price on a valid response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ price: 2345.6789 }), { status: 200 })
    );

    const result = await fetchGoldapiPrice();
    expect(result).toEqual({
      pricePerTroyOz: "2345.6789",
      source: GOLDAPI_SOURCE,
    });
  });

  it("throws on a non-2xx HTTP status", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("rate limited", { status: 429 })
    );

    await expect(fetchGoldapiPrice()).rejects.toThrow("status 429");
  });

  // A provider returning HTTP 200 with an error body is the expected
  // failure mode to guard against, not an edge case.
  it("throws on a 200 response with an error body instead of a price", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "rate limit exceeded" }), {
        status: 200,
      })
    );

    await expect(fetchGoldapiPrice()).rejects.toThrow(
      "response failed validation"
    );
  });

  it("throws when the price field is not a positive number", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ price: -5 }), { status: 200 })
    );

    await expect(fetchGoldapiPrice()).rejects.toThrow();
  });
});
