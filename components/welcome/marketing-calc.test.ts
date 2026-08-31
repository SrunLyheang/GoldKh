import { describe, expect, it } from "vitest";
import {
  computeMarketingPosition,
  formatSignedPercent,
  formatSignedUsd,
  INDICATIVE_SPOT_PER_DAMLUNG,
  toDamlung,
  type MarketingBuy,
} from "./marketing-calc";

describe("toDamlung", () => {
  it("passes damlung through unchanged", () => {
    expect(toDamlung(2, "damlung")).toBe(2);
  });

  it("converts chi to damlung (10 chi = 1 damlung)", () => {
    expect(toDamlung(10, "chi")).toBe(1);
    expect(toDamlung(5, "chi")).toBe(0.5);
  });

  it("clamps negative and non-finite quantities to zero", () => {
    expect(toDamlung(-3, "damlung")).toBe(0);
    expect(toDamlung(Number.NaN, "chi")).toBe(0);
  });
});

describe("computeMarketingPosition", () => {
  it("is all zeros for an empty ledger", () => {
    const p = computeMarketingPosition([], INDICATIVE_SPOT_PER_DAMLUNG);
    expect(p.totalDamlung).toBe(0);
    expect(p.averageCostPerDamlung).toBe(0);
    expect(p.unrealizedUsd).toBe(0);
    expect(p.unrealizedPercent).toBe(0);
  });

  it("weights the average cost across buys of different sizes", () => {
    const buys: MarketingBuy[] = [
      { id: "a", quantity: 1, unit: "damlung", pricePerDamlung: 4000 },
      { id: "b", quantity: 3, unit: "damlung", pricePerDamlung: 5000 },
    ];
    // (1*4000 + 3*5000) / 4 = 4750
    const p = computeMarketingPosition(buys, 5000);
    expect(p.totalDamlung).toBe(4);
    expect(p.averageCostPerDamlung).toBe(4750);
    expect(p.totalInvestedUsd).toBe(19000);
    expect(p.marketValueUsd).toBe(20000);
    expect(p.unrealizedUsd).toBe(1000);
    expect(p.unrealizedPercent).toBeCloseTo((1000 / 19000) * 100, 6);
  });

  it("mixes chi and damlung buys on one damlung basis", () => {
    const buys: MarketingBuy[] = [
      { id: "a", quantity: 10, unit: "chi", pricePerDamlung: 4800 },
      { id: "b", quantity: 1, unit: "damlung", pricePerDamlung: 5200 },
    ];
    const p = computeMarketingPosition(buys, 5000);
    expect(p.totalDamlung).toBe(2);
    expect(p.totalChi).toBe(20);
    expect(p.averageCostPerDamlung).toBe(5000);
    expect(p.unrealizedUsd).toBe(0);
  });

  it("goes negative when spot is below the average cost", () => {
    const buys: MarketingBuy[] = [
      { id: "a", quantity: 1, unit: "damlung", pricePerDamlung: 5000 },
    ];
    const p = computeMarketingPosition(buys, 4500);
    expect(p.unrealizedUsd).toBe(-500);
    expect(p.unrealizedPercent).toBeCloseTo(-10, 6);
  });

  it("ignores rows whose quantity is zero or negative", () => {
    const buys: MarketingBuy[] = [
      { id: "a", quantity: 0, unit: "damlung", pricePerDamlung: 5000 },
      { id: "b", quantity: -2, unit: "chi", pricePerDamlung: 5000 },
      { id: "c", quantity: 2, unit: "damlung", pricePerDamlung: 5000 },
    ];
    const p = computeMarketingPosition(buys, 5000);
    expect(p.totalDamlung).toBe(2);
    expect(p.totalInvestedUsd).toBe(10000);
  });
});

describe("sign formatting", () => {
  it("uses a real minus sign for negatives and a plus for non-negatives", () => {
    expect(formatSignedUsd(1234.5)).toBe("+$1,234.50");
    expect(formatSignedUsd(-1234.5)).toBe("−$1,234.50");
    expect(formatSignedPercent(4.2)).toBe("+4.20%");
    expect(formatSignedPercent(-4.2)).toBe("−4.20%");
  });
});
