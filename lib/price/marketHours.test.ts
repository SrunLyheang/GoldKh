import { describe, expect, it } from "vitest";
import { isMarketOpen } from "./marketHours";

// Spot gold (XAU/USD) trades from Sunday 22:00 UTC to Friday 21:00 UTC.
// isMarketOpen uses fixed UTC boundaries — the cases below pin every edge.
describe("isMarketOpen", () => {
  it("is open midweek", () => {
    expect(isMarketOpen(new Date("2026-08-26T12:00:00Z"))).toBe(true); // Wednesday
  });

  it("is open on Friday right up to 21:00 UTC", () => {
    expect(isMarketOpen(new Date("2026-08-28T20:59:59Z"))).toBe(true); // Friday
  });

  it("is closed on Friday from 21:00 UTC onward", () => {
    expect(isMarketOpen(new Date("2026-08-28T21:00:00Z"))).toBe(false); // Friday
  });

  it("is closed all of Saturday", () => {
    expect(isMarketOpen(new Date("2026-08-29T00:00:00Z"))).toBe(false);
    expect(isMarketOpen(new Date("2026-08-29T23:59:59Z"))).toBe(false);
  });

  it("is closed on Sunday before 22:00 UTC", () => {
    expect(isMarketOpen(new Date("2026-08-30T21:59:59Z"))).toBe(false); // Sunday
  });

  it("re-opens on Sunday at 22:00 UTC", () => {
    expect(isMarketOpen(new Date("2026-08-30T22:00:00Z"))).toBe(true); // Sunday
  });

  it("is open early Monday", () => {
    expect(isMarketOpen(new Date("2026-08-31T00:00:00Z"))).toBe(true); // Monday
  });
});
