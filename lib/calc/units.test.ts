import { describe, expect, it } from "vitest";
import { fromTroyOz, priceFromTroyOz, priceToTroyOz, toTroyOz } from "./units";

describe("toTroyOz", () => {
  it("converts chi to troy oz using GRAMS_PER_CHI / GRAMS_PER_TROY_OZ", () => {
    // 1 chi = 3.75g, 1 troy oz = 31.1034768g -> 1 chi ≈ 0.12057 oz
    expect(Number(toTroyOz("1", "chi"))).toBeCloseTo(0.120563, 5);
  });

  it("converts damlung to troy oz (1 damlung = 10 chi)", () => {
    expect(Number(toTroyOz("1", "damlung"))).toBeCloseTo(1.20563, 4);
  });

  it("is the inverse of fromTroyOz", () => {
    const oz = toTroyOz("5", "chi");
    expect(Number(fromTroyOz(oz, "chi"))).toBeCloseTo(5, 6);
  });
});

describe("priceToTroyOz / priceFromTroyOz", () => {
  it("round-trips a price per chi through troy oz and back", () => {
    const pricePerChi = "300";
    const perOz = priceToTroyOz(pricePerChi, "chi");
    const backToChi = priceFromTroyOz(perOz, "chi");
    expect(Number(backToChi)).toBeCloseTo(300, 6);
  });

  it("a higher price per troy oz means a lower price per chi", () => {
    const perOz = "2000";
    const perChi = priceFromTroyOz(perOz, "chi");
    expect(Number(perChi)).toBeLessThan(Number(perOz));
  });
});
