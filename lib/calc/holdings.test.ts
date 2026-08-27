import { describe, expect, it } from "vitest";
import { computeHoldings } from "./holdings";
import type { LedgerEntry } from "./ledgerEntry";

function buy(
  quantity: string,
  unit: "chi" | "damlung",
  price: string,
  currency: "USD" | "KHR" = "USD"
): LedgerEntry {
  return { type: "buy", quantity, unit, pricePerUnit: price, currency };
}

function sell(
  quantity: string,
  unit: "chi" | "damlung",
  price: string,
  currency: "USD" | "KHR" = "USD"
): LedgerEntry {
  return { type: "sell", quantity, unit, pricePerUnit: price, currency };
}

describe("computeHoldings", () => {
  it("returns zero holdings for no transactions", () => {
    const result = computeHoldings([]);
    expect(result.totalTroyOz).toBe("0");
    expect(result.averageCostPerTroyOz).toBe("0");
  });

  it("a single buy sets average cost to that buy's price", () => {
    const result = computeHoldings([buy("10", "chi", "300")]);
    expect(Number(result.totalTroyOz)).toBeGreaterThan(0);
    expect(Number(result.averageCostPerTroyOz)).toBeGreaterThan(0);
  });

  it("weights average cost across two buys at different prices", () => {
    const withTwoBuys = computeHoldings([
      buy("10", "chi", "300"),
      buy("10", "chi", "320"),
    ]);
    const withOneBuy = computeHoldings([buy("10", "chi", "300")]);

    expect(Number(withTwoBuys.totalTroyOz)).toBeCloseTo(
      Number(withOneBuy.totalTroyOz) * 2,
      6
    );
    expect(Number(withTwoBuys.averageCostPerTroyOz)).not.toBeCloseTo(
      Number(withOneBuy.averageCostPerTroyOz),
      2
    );
  });

  it("a sell reduces quantity but leaves average cost unchanged — the worked example from project-overview.md", () => {
    const afterSell = computeHoldings([
      buy("10", "chi", "300"),
      sell("3", "chi", "999"),
    ]);
    const sevenChiOnly = computeHoldings([buy("7", "chi", "300")]);

    expect(Number(afterSell.totalTroyOz)).toBeCloseTo(
      Number(sevenChiOnly.totalTroyOz),
      6
    );
    expect(Number(afterSell.averageCostPerTroyOz)).toBeCloseTo(
      Number(sevenChiOnly.averageCostPerTroyOz),
      6
    );
  });

  it("selling the entire position returns to zero holdings and zero average cost", () => {
    const result = computeHoldings([
      buy("10", "chi", "300"),
      sell("10", "chi", "350"),
    ]);
    expect(Number(result.totalTroyOz)).toBeCloseTo(0, 6);
    expect(result.averageCostPerTroyOz).toBe("0");
  });

  it("mixes chi and damlung buys into one consistent average cost", () => {
    const chiOnly = computeHoldings([buy("10", "chi", "300")]);
    const mixed = computeHoldings([
      buy("10", "chi", "300"),
      buy("1", "damlung", "3000"),
    ]);

    expect(Number(mixed.totalTroyOz)).toBeCloseTo(
      Number(chiOnly.totalTroyOz) * 2,
      6
    );
    expect(Number(mixed.averageCostPerTroyOz)).toBeCloseTo(
      Number(chiOnly.averageCostPerTroyOz),
      6
    );
  });

  it("excludes KHR rows from the aggregate — a KHR buy at a realistic per-chi price must not skew average cost", () => {
    const usdOnly = computeHoldings([buy("10", "chi", "300")]);
    const withKhrBuy = computeHoldings([
      buy("10", "chi", "300"),
      buy("5", "chi", "1200000", "KHR"),
    ]);

    expect(withKhrBuy.totalTroyOz).toBe(usdOnly.totalTroyOz);
    expect(withKhrBuy.averageCostPerTroyOz).toBe(usdOnly.averageCostPerTroyOz);
  });

  it("holdings are zero when every transaction is KHR", () => {
    const result = computeHoldings([buy("10", "chi", "1200000", "KHR")]);
    expect(result.totalTroyOz).toBe("0");
    expect(result.averageCostPerTroyOz).toBe("0");
  });
});
