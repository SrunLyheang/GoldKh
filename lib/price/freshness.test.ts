import { describe, expect, it } from "vitest";
import { priceFreshness } from "./freshness";
import {
  MANUAL_REFRESH_COOLDOWN_MS,
  PRICE_STALENESS_MS,
} from "@/lib/constants/staleness";

const NOW = 1_700_000_000_000;
const at = (ageMs: number) => ({ capturedAt: new Date(NOW - ageMs) });

describe("priceFreshness", () => {
  it("treats a missing snapshot as stale with no cooldown", () => {
    expect(priceFreshness(undefined, NOW)).toEqual({
      isStale: true,
      cooldownActive: false,
      cooldownEndsAt: null,
    });
  });

  it("a just-captured snapshot is fresh and inside the cooldown", () => {
    const f = priceFreshness(at(1_000), NOW);
    expect(f.isStale).toBe(false);
    expect(f.cooldownActive).toBe(true);
    expect(f.cooldownEndsAt).toBe(NOW - 1_000 + MANUAL_REFRESH_COOLDOWN_MS);
  });

  it("clears the cooldown once the snapshot passes MANUAL_REFRESH_COOLDOWN_MS", () => {
    const f = priceFreshness(at(MANUAL_REFRESH_COOLDOWN_MS + 1), NOW);
    expect(f.cooldownActive).toBe(false);
    expect(f.cooldownEndsAt).toBeNull();
    expect(f.isStale).toBe(false); // still within the 30-min staleness window
  });

  it("is not stale one ms before PRICE_STALENESS_MS", () => {
    expect(priceFreshness(at(PRICE_STALENESS_MS - 1), NOW).isStale).toBe(false);
  });

  it("is stale exactly at PRICE_STALENESS_MS (refetch at the boundary)", () => {
    expect(priceFreshness(at(PRICE_STALENESS_MS), NOW).isStale).toBe(true);
  });

  it("is stale well past PRICE_STALENESS_MS", () => {
    expect(priceFreshness(at(PRICE_STALENESS_MS * 3), NOW).isStale).toBe(true);
  });

  it("defaults now to the current clock", () => {
    const f = priceFreshness({ capturedAt: new Date() });
    expect(f.isStale).toBe(false);
    expect(f.cooldownActive).toBe(true);
  });
});
