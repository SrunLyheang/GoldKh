import { describe, expect, it } from "vitest";
import { computeWhatIf } from "./whatIf";
import { computeHoldings } from "./holdings";

// 2 damlung already held at a $5000/damlung average cost.
const CURRENT = computeHoldings([
  { type: "buy", quantity: "2", unit: "damlung", pricePerUnit: "5000", currency: "USD" },
]);

describe("computeWhatIf", () => {
  it("blends a hypothetical buy into the average cost", () => {
    // Add 2 damlung for $12000 (=$6000/damlung): (2×5000 + 12000) / 4 = 5500.
    const result = computeWhatIf(CURRENT, {
      quantity: "2",
      unit: "damlung",
      totalPriceUsd: "12000",
    });
    expect(Number(result.newAverageCostPerDamlung)).toBeCloseTo(5500, 4);
    expect(Number(result.newHoldingsDamlung)).toBeCloseTo(4, 6);
    expect(Number(result.newHoldingsChi)).toBeCloseTo(40, 6);
  });

  it("break-even spot per damlung equals the blended average cost", () => {
    const result = computeWhatIf(CURRENT, {
      quantity: "2",
      unit: "damlung",
      totalPriceUsd: "12000",
    });
    expect(Number(result.breakEvenSpotPerDamlung)).toBeCloseTo(
      Number(result.newAverageCostPerDamlung),
      6,
    );
  });

  it("works from an empty position", () => {
    const empty = { totalTroyOz: "0", averageCostPerTroyOz: "0" };
    const result = computeWhatIf(empty, {
      quantity: "1",
      unit: "damlung",
      totalPriceUsd: "5000",
    });
    expect(Number(result.newAverageCostPerDamlung)).toBeCloseTo(5000, 4);
    expect(Number(result.newHoldingsDamlung)).toBeCloseTo(1, 6);
    expect(Number(result.newHoldingsChi)).toBeCloseTo(10, 6);
  });

  it("accepts the hypothetical quantity in chi", () => {
    const empty = { totalTroyOz: "0", averageCostPerTroyOz: "0" };
    const result = computeWhatIf(empty, {
      quantity: "10",
      unit: "chi",
      totalPriceUsd: "5000",
    });
    // 10 chi = 1 damlung for $5000 → $5000/damlung.
    expect(Number(result.newAverageCostPerDamlung)).toBeCloseTo(5000, 4);
    expect(Number(result.newHoldingsChi)).toBeCloseTo(10, 6);
  });

  it("returns zeros for a non-positive hypothetical quantity", () => {
    const result = computeWhatIf(CURRENT, {
      quantity: "0",
      unit: "damlung",
      totalPriceUsd: "5000",
    });
    expect(result).toEqual({
      newAverageCostPerTroyOz: "0",
      newAverageCostPerDamlung: "0",
      newHoldingsChi: "0",
      newHoldingsDamlung: "0",
      breakEvenSpotPerDamlung: "0",
    });
  });
});
