import { describe, expect, it } from "vitest";
import { computePosition } from "./position";
import type { DatedLedgerEntry } from "./portfolioSeries";

function entry(
  transactionDate: string,
  type: "buy" | "sell",
  quantity: string,
  price: string,
  currency: "USD" | "KHR" = "USD",
): DatedLedgerEntry {
  return {
    transactionDate,
    type,
    quantity,
    unit: "chi",
    pricePerUnit: price,
    currency,
  };
}

const SPOT = "3000";

describe("computePosition", () => {
  it("replays newest-first input in chronological order — a sell listed before its buy still values against that buy", () => {
    // Stored newest-first: the sell row comes first, the buy that funds it second.
    const newestFirst = [
      entry("2024-02-01", "sell", "3", "999"),
      entry("2024-01-01", "buy", "10", "300"),
    ];
    const alreadyOrdered = [
      entry("2024-01-01", "buy", "10", "300"),
      entry("2024-02-01", "sell", "3", "999"),
    ];

    expect(computePosition(newestFirst, SPOT)).toEqual(
      computePosition(alreadyOrdered, SPOT),
    );
    // 7 chi left at $300 average cost — the worked example from CONTEXT.md.
    expect(Number(computePosition(newestFirst, SPOT).holdings.totalTroyOz)).toBeCloseTo(
      Number(computePosition([entry("2024-01-01", "buy", "7", "300")], SPOT).holdings.totalTroyOz),
      6,
    );
    expect(computePosition(newestFirst, SPOT).realized.saleCount).toBe(1);
  });

  it("no holdings → hasHoldings false and no break-even line", () => {
    const result = computePosition([], SPOT);
    expect(result.hasHoldings).toBe(false);
    expect(result.breakEvenPerDamlung).toBeUndefined();
  });

  it("holdings → hasHoldings true and a positive per-damlung break-even", () => {
    const result = computePosition([entry("2024-01-01", "buy", "10", "300")], SPOT);
    expect(result.hasHoldings).toBe(true);
    expect(result.breakEvenPerDamlung).toBeGreaterThan(0);
  });

  it("gain/loss is measured against the passed spot price", () => {
    const entries = [entry("2024-01-01", "buy", "10", "300")];
    const flat = computePosition(entries, "300"); // spot per chi ≈ cost
    // priceFromTroyOz math aside, a much higher spot must show a gain.
    const up = computePosition(entries, "9000");
    expect(Number(up.gainLoss.gainLossUsd)).toBeGreaterThan(
      Number(flat.gainLoss.gainLossUsd),
    );
  });
});
