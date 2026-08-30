import { describe, expect, it, vi } from "vitest";
import { getPrice, type GetPriceDeps, type PriceSnapshot } from "./getPrice";
import { PRICE_STALENESS_MS } from "@/lib/constants/staleness";

function snapshot(overrides: Partial<PriceSnapshot> = {}): PriceSnapshot {
  return {
    id: "snap-1",
    pricePerTroyOz: "2000",
    source: "goldapi.io",
    capturedAt: new Date(),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<GetPriceDeps> = {}): GetPriceDeps {
  return {
    getLatestSnapshot: vi.fn().mockResolvedValue(undefined),
    insertSnapshotIfStale: vi.fn().mockResolvedValue(snapshot()),
    providers: [],
    isMarketOpen: () => true,
    ...overrides,
  };
}

describe("getPrice", () => {
  it("returns the cached snapshot when it is fresh", async () => {
    const fresh = snapshot({ capturedAt: new Date() });
    const deps = makeDeps({
      getLatestSnapshot: vi.fn().mockResolvedValue(fresh),
    });

    const result = await getPrice(deps);

    expect(result).toBe(fresh);
    expect(deps.providers).toEqual([]);
  });

  it("calls the provider and inserts when the cache is stale", async () => {
    const stale = snapshot({
      capturedAt: new Date(Date.now() - PRICE_STALENESS_MS - 1000),
    });
    const inserted = snapshot({ id: "snap-2", pricePerTroyOz: "2100" });
    const provider = vi
      .fn()
      .mockResolvedValue({ pricePerTroyOz: "2100", source: "goldapi.io" });
    const deps = makeDeps({
      getLatestSnapshot: vi.fn().mockResolvedValue(stale),
      insertSnapshotIfStale: vi.fn().mockResolvedValue(inserted),
      providers: [provider],
    });

    const result = await getPrice(deps);

    expect(provider).toHaveBeenCalledOnce();
    expect(result).toBe(inserted);
  });

  it("rotates to the next provider when the first one throws", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("provider down"));
    const working = vi
      .fn()
      .mockResolvedValue({ pricePerTroyOz: "2100", source: "backup" });
    const inserted = snapshot({ source: "backup" });
    const deps = makeDeps({
      getLatestSnapshot: vi.fn().mockResolvedValue(undefined),
      insertSnapshotIfStale: vi.fn().mockResolvedValue(inserted),
      providers: [failing, working],
    });

    const result = await getPrice(deps);

    expect(failing).toHaveBeenCalledOnce();
    expect(working).toHaveBeenCalledOnce();
    expect(result).toBe(inserted);
  });

  it("falls back to the last cached price when every provider fails", async () => {
    const stale = snapshot({
      capturedAt: new Date(Date.now() - PRICE_STALENESS_MS - 1000),
    });
    const failing = vi.fn().mockRejectedValue(new Error("down"));
    const deps = makeDeps({
      getLatestSnapshot: vi.fn().mockResolvedValue(stale),
      providers: [failing, failing],
    });

    const result = await getPrice(deps);

    expect(result).toBe(stale);
  });

  it("throws when every provider fails and there is no cache at all", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("down"));
    const deps = makeDeps({
      getLatestSnapshot: vi.fn().mockResolvedValue(undefined),
      providers: [failing],
    });

    await expect(getPrice(deps)).rejects.toThrow(
      "All price providers failed"
    );
  });

  it("serves the cached snapshot without calling a provider when the market is closed", async () => {
    const stale = snapshot({
      capturedAt: new Date(Date.now() - PRICE_STALENESS_MS - 1000),
    });
    const provider = vi.fn();
    const deps = makeDeps({
      getLatestSnapshot: vi.fn().mockResolvedValue(stale),
      providers: [provider],
      isMarketOpen: () => false,
    });

    const result = await getPrice(deps);

    expect(result).toBe(stale);
    expect(provider).not.toHaveBeenCalled();
  });

  it("still calls a provider when the market is closed but there is no cache at all", async () => {
    const provider = vi
      .fn()
      .mockResolvedValue({ pricePerTroyOz: "2100", source: "goldapi.io" });
    const inserted = snapshot({ id: "snap-cold-start" });
    const deps = makeDeps({
      getLatestSnapshot: vi.fn().mockResolvedValue(undefined),
      insertSnapshotIfStale: vi.fn().mockResolvedValue(inserted),
      providers: [provider],
      isMarketOpen: () => false,
    });

    const result = await getPrice(deps);

    expect(provider).toHaveBeenCalledOnce();
    expect(result).toBe(inserted);
  });

  it("re-reads the latest snapshot when a concurrent insert wins the race", async () => {
    // insertSnapshotIfStale returning undefined models the WHERE NOT EXISTS
    // conditional insert finding a fresh row already there.
    const wonByAnotherRequest = snapshot({ id: "snap-winner" });
    const provider = vi
      .fn()
      .mockResolvedValue({ pricePerTroyOz: "2100", source: "goldapi.io" });
    const getLatestSnapshot = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(wonByAnotherRequest);
    const deps = makeDeps({
      getLatestSnapshot,
      insertSnapshotIfStale: vi.fn().mockResolvedValue(undefined),
      providers: [provider],
    });

    const result = await getPrice(deps);

    expect(result).toBe(wonByAnotherRequest);
  });
});
