import { describe, expect, it } from "vitest";
import { computeRowValuation, type TransactionRowLike } from "./transactionRow";

function buy(overrides: Partial<TransactionRowLike> = {}): TransactionRowLike {
  return {
    type: "buy",
    quantity: "1",
    unit: "damlung",
    pricePerUnit: "5000",
    currency: "USD",
    ...overrides,
  };
}

describe("computeRowValuation", () => {
  it("computes current value and P&L for a USD buy row", () => {
    const result = computeRowValuation(buy(), "4200"); // spot in $/oz
    expect(result.amountUsd).toBe("5000");
    expect(result.currentValueUsd).not.toBeNull();
    expect(result.pnlUsd).not.toBeNull();
    expect(result.pnlPercent).not.toBeNull();
  });

  it("reports a positive P&L when current price is above the buy price", () => {
    const result = computeRowValuation(buy(), "10000");
    expect(Number(result.pnlUsd)).toBeGreaterThan(0);
    expect(Number(result.pnlPercent)).toBeGreaterThan(0);
  });

  it("returns null current value and P&L for a sell row", () => {
    const result = computeRowValuation(buy({ type: "sell" }), "4200");
    expect(result.amountUsd).toBe("5000");
    expect(result.currentValueUsd).toBeNull();
    expect(result.pnlUsd).toBeNull();
    expect(result.pnlPercent).toBeNull();
  });

  it("returns null USD figures for a KHR row — conversion is deferred", () => {
    const result = computeRowValuation(buy({ currency: "KHR" }), "4200");
    expect(result.amountUsd).toBeNull();
    expect(result.currentValueUsd).toBeNull();
    expect(result.pnlUsd).toBeNull();
    expect(result.pnlPercent).toBeNull();
  });

  it("always returns a price-per-damlung figure regardless of currency or type", () => {
    const result = computeRowValuation(
      buy({ currency: "KHR", type: "sell", unit: "chi" }),
      "4200"
    );
    expect(Number(result.pricePerDamlung)).toBeGreaterThan(0);
  });
});
