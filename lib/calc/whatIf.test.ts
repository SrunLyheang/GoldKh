import { describe, expect, it } from "vitest";
import { computeWhatIf, spotImpliedTotal } from "./whatIf";
import { computeHoldings } from "./holdings";
import { priceToTroyOz } from "./units";

// 2 damlung already held at a $5000/damlung average cost.
const CURRENT = computeHoldings([
  { type: "buy", quantity: "2", unit: "damlung", pricePerUnit: "5000", currency: "USD" },
]);

// Live spot quoted at $5200 per damlung.
const SPOT_PER_OZ = priceToTroyOz("5200", "damlung");

describe("computeWhatIf — buy mode", () => {
  it("blends a hypothetical buy into the average cost and holdings", () => {
    // Add 2 damlung for $12000 (=$6000/damlung): (2×5000 + 12000) / 4 = 5500.
    const result = computeWhatIf(CURRENT, {
      mode: "buy",
      quantity: "2",
      unit: "damlung",
      totalPriceUsd: "12000",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    expect(Number(result.averageCostPerDamlung.before)).toBeCloseTo(5000, 4);
    expect(Number(result.averageCostPerDamlung.after)).toBeCloseTo(5500, 4);
    expect(Number(result.averageCostPerDamlung.delta)).toBeCloseTo(500, 4);
    expect(Number(result.holdingsDamlung.after)).toBeCloseTo(4, 6);
    expect(Number(result.holdingsDamlung.delta)).toBeCloseTo(2, 6);
    expect(Number(result.holdingsChi.after)).toBeCloseTo(40, 6);
  });

  it("reports the unrealized P&L at today's spot before and after the buy", () => {
    const result = computeWhatIf(CURRENT, {
      mode: "buy",
      quantity: "2",
      unit: "damlung",
      totalPriceUsd: "12000",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    // Before: 2 damlung, cost 10000, value 10400 → +400.
    expect(Number(result.unrealizedUsd.before)).toBeCloseTo(400, 2);
    // After: 4 damlung, cost 22000, value 20800 → −1200.
    expect(Number(result.unrealizedUsd.after)).toBeCloseTo(-1200, 2);
    expect(Number(result.unrealizedUsd.delta)).toBeCloseTo(-1600, 2);
    expect(Number(result.unrealizedPercent.after)).toBeCloseTo(-5.4545, 3);
  });

  it("break-even spot per damlung equals the blended average cost", () => {
    const result = computeWhatIf(CURRENT, {
      mode: "buy",
      quantity: "2",
      unit: "damlung",
      totalPriceUsd: "12000",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    expect(Number(result.breakEvenSpotPerDamlung.after)).toBeCloseTo(
      Number(result.averageCostPerDamlung.after),
      6,
    );
  });

  it("works from an empty position", () => {
    const empty = { totalTroyOz: "0", averageCostPerTroyOz: "0" };
    const result = computeWhatIf(empty, {
      mode: "buy",
      quantity: "1",
      unit: "damlung",
      totalPriceUsd: "5000",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    expect(Number(result.averageCostPerDamlung.after)).toBeCloseTo(5000, 4);
    expect(Number(result.holdingsDamlung.after)).toBeCloseTo(1, 6);
    expect(Number(result.holdingsChi.after)).toBeCloseTo(10, 6);
  });

  it("accepts the hypothetical quantity in chi", () => {
    const empty = { totalTroyOz: "0", averageCostPerTroyOz: "0" };
    const result = computeWhatIf(empty, {
      mode: "buy",
      quantity: "10",
      unit: "chi",
      totalPriceUsd: "5000",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    // 10 chi = 1 damlung for $5000 → $5000/damlung.
    expect(Number(result.averageCostPerDamlung.after)).toBeCloseTo(5000, 4);
    expect(Number(result.holdingsChi.after)).toBeCloseTo(10, 6);
  });

  it("returns a zeroed result for a non-positive hypothetical quantity", () => {
    const result = computeWhatIf(CURRENT, {
      mode: "buy",
      quantity: "0",
      unit: "damlung",
      totalPriceUsd: "5000",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    expect(Number(result.averageCostPerDamlung.after)).toBe(0);
    expect(Number(result.holdingsDamlung.after)).toBe(0);
    expect(result.overSell).toBe(false);
  });
});

describe("computeWhatIf — sell mode", () => {
  it("reports proceeds and realized gain against the current average cost", () => {
    // Sell 1 damlung for $5300. Cost basis of the sold gold = 1 × 5000.
    const result = computeWhatIf(CURRENT, {
      mode: "sell",
      quantity: "1",
      unit: "damlung",
      totalPriceUsd: "5300",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    expect(Number(result.proceedsUsd)).toBeCloseTo(5300, 2);
    expect(Number(result.realizedUsd)).toBeCloseTo(300, 2);
    expect(Number(result.realizedPercent)).toBeCloseTo(6, 4);
  });

  it("leaves the average cost per damlung unchanged and draws down the position", () => {
    const result = computeWhatIf(CURRENT, {
      mode: "sell",
      quantity: "1",
      unit: "damlung",
      totalPriceUsd: "5300",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    expect(Number(result.averageCostPerDamlung.before)).toBeCloseTo(5000, 4);
    expect(Number(result.averageCostPerDamlung.after)).toBeCloseTo(5000, 4);
    expect(Number(result.averageCostPerDamlung.delta)).toBeCloseTo(0, 6);
    expect(Number(result.holdingsDamlung.after)).toBeCloseTo(1, 6);
    expect(Number(result.holdingsDamlung.delta)).toBeCloseTo(-1, 6);
  });

  it("reports the remaining unrealized P&L at today's spot", () => {
    const result = computeWhatIf(CURRENT, {
      mode: "sell",
      quantity: "1",
      unit: "damlung",
      totalPriceUsd: "5300",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    // Remaining 1 damlung, cost 5000, value 5200 → +200. Before was +400.
    expect(Number(result.unrealizedUsd.before)).toBeCloseTo(400, 2);
    expect(Number(result.unrealizedUsd.after)).toBeCloseTo(200, 2);
    expect(Number(result.unrealizedUsd.delta)).toBeCloseTo(-200, 2);
  });

  it("flags a sale larger than the current position", () => {
    const result = computeWhatIf(CURRENT, {
      mode: "sell",
      quantity: "3",
      unit: "damlung",
      totalPriceUsd: "15000",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    expect(result.overSell).toBe(true);
  });

  it("does not flag a sale of the entire position", () => {
    const result = computeWhatIf(CURRENT, {
      mode: "sell",
      quantity: "2",
      unit: "damlung",
      totalPriceUsd: "10000",
      currentPricePerTroyOz: SPOT_PER_OZ,
    });
    expect(result.overSell).toBe(false);
    expect(Number(result.holdingsDamlung.after)).toBeCloseTo(0, 6);
  });
});

describe("spotImpliedTotal", () => {
  it("values the entered quantity at the current spot price", () => {
    // 2 damlung at $5200/damlung spot = $10400.
    expect(Number(spotImpliedTotal("2", "damlung", SPOT_PER_OZ))).toBeCloseTo(
      10400,
      2,
    );
  });

  it("is zero for a non-positive quantity", () => {
    expect(spotImpliedTotal("0", "damlung", SPOT_PER_OZ)).toBe("0");
    expect(spotImpliedTotal("", "damlung", SPOT_PER_OZ)).toBe("0");
  });
});
