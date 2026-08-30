import { describe, expect, it } from "vitest";
import { computeRealized } from "./realized";
import type { LedgerEntry } from "./ledgerEntry";

function buy(
  quantity: string,
  pricePerUnit: string,
  unit: LedgerEntry["unit"] = "damlung",
  currency: LedgerEntry["currency"] = "USD"
): LedgerEntry {
  return { type: "buy", quantity, unit, pricePerUnit, currency };
}

function sell(
  quantity: string,
  pricePerUnit: string,
  unit: LedgerEntry["unit"] = "damlung",
  currency: LedgerEntry["currency"] = "USD"
): LedgerEntry {
  return { type: "sell", quantity, unit, pricePerUnit, currency };
}

describe("computeRealized", () => {
  it("is zero when nothing has been sold", () => {
    expect(computeRealized([buy("2", "5000")])).toEqual({
      realizedUsd: "0",
      realizedPercent: "0",
      saleCount: 0,
    });
  });

  it("reports the loss on the buy-1-@5585 / sell-1-@5300 worked example", () => {
    // Buy 1 damlung for 5585, sell 1 damlung for 5300.
    const result = computeRealized([buy("1", "5585"), sell("1", "5300")]);
    expect(Number(result.realizedUsd)).toBeCloseTo(-285, 6);
    expect(Number(result.realizedPercent)).toBeCloseTo(-5.1029, 3);
    expect(result.saleCount).toBe(1);
  });

  it("reports a gain when the sale price beats the average cost", () => {
    // Buy 10 chi @ 300 (cost 3000), sell 3 chi @ 400.
    // basis of the 3 sold = 900, proceeds = 1200 → +300, +33.33%.
    const result = computeRealized([
      buy("10", "300", "chi"),
      sell("3", "400", "chi"),
    ]);
    expect(Number(result.realizedUsd)).toBeCloseTo(300, 6);
    expect(Number(result.realizedPercent)).toBeCloseTo(33.333, 2);
    expect(result.saleCount).toBe(1);
  });

  it("values a sell at the weighted average across earlier buys", () => {
    // Buy 5 chi @ 200, buy 5 chi @ 400 → avg 300. Sell 4 chi @ 350.
    // basis = 1200, proceeds = 1400 → +200.
    const result = computeRealized([
      buy("5", "200", "chi"),
      buy("5", "400", "chi"),
      sell("4", "350", "chi"),
    ]);
    expect(Number(result.realizedUsd)).toBeCloseTo(200, 6);
    expect(result.saleCount).toBe(1);
  });

  it("accumulates across multiple sells", () => {
    const result = computeRealized([
      buy("10", "300", "chi"),
      sell("3", "400", "chi"), // +300
      sell("2", "250", "chi"), // -100
    ]);
    expect(Number(result.realizedUsd)).toBeCloseTo(200, 6);
    expect(result.saleCount).toBe(2);
  });

  it("skips KHR sells — they can't be valued against USD basis", () => {
    const result = computeRealized([
      buy("1", "5000"),
      sell("1", "20000000", "damlung", "KHR"),
    ]);
    expect(result).toEqual({
      realizedUsd: "0",
      realizedPercent: "0",
      saleCount: 0,
    });
  });
});
