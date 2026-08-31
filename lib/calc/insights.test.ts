import { describe, expect, it } from "vitest";
import { computeInsights } from "./insights";

const buy = (
  quantity: string,
  pricePerUnit: string,
  transactionDate: string,
  unit: "chi" | "damlung" = "damlung",
  currency: "USD" | "KHR" = "USD",
) => ({
  type: "buy" as const,
  quantity,
  unit,
  pricePerUnit,
  currency,
  transactionDate,
});

const sell = (quantity: string, pricePerUnit: string, transactionDate: string) => ({
  type: "sell" as const,
  quantity,
  unit: "damlung" as const,
  pricePerUnit,
  currency: "USD" as const,
  transactionDate,
});

describe("computeInsights", () => {
  it("has no aggregates when there are no USD buys", () => {
    expect(computeInsights([sell("1", "7000", "2026-01-01")])).toEqual({
      totalInvestedUsd: "0",
      buyCount: 0,
      largestBuy: null,
    });
  });

  it("sums invested across USD buys and counts them", () => {
    const result = computeInsights([
      buy("2", "5000", "2026-01-10"), // 10000
      buy("1", "6000", "2026-02-10"), // 6000
      sell("1", "7000", "2026-03-10"), // ignored
    ]);
    expect(Number(result.totalInvestedUsd)).toBeCloseTo(16000, 6);
    expect(result.buyCount).toBe(2);
  });

  it("names the largest buy by USD amount", () => {
    const result = computeInsights([
      buy("2", "5000", "2026-01-10"), // 10000
      buy("1", "6000", "2026-02-10"), // 6000
      buy("30", "300", "2026-02-20", "chi"), // 9000
    ]);
    expect(result.largestBuy).toEqual({
      quantity: "2",
      unit: "damlung",
      transactionDate: "2026-01-10",
      amountUsd: "10000",
    });
  });

  it("excludes KHR buys from every aggregate", () => {
    const result = computeInsights([
      buy("1", "6000", "2026-02-10"),
      buy("2", "20000000", "2026-01-10", "damlung", "KHR"),
    ]);
    expect(Number(result.totalInvestedUsd)).toBeCloseTo(6000, 6);
    expect(result.buyCount).toBe(1);
    expect(result.largestBuy?.transactionDate).toBe("2026-02-10");
  });
});
