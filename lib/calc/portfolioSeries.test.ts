import { describe, expect, it } from "vitest";
import { buildPortfolioSeries } from "./portfolioSeries";
import { toTroyOz } from "./units";

// A buy of `q` chi for a total of `C` USD, valued at any snapshot dated
// on or after the buy, has cost basis exactly `C` — the running average
// cost times the quantity is the money the user actually put in.
const BUY_10_CHI_3000 = {
  type: "buy" as const,
  quantity: "10",
  unit: "chi" as const,
  pricePerUnit: "300",
  currency: "USD" as const,
  transactionDate: "2026-01-10",
};

const SELL_3_CHI_1200 = {
  type: "sell" as const,
  quantity: "3",
  unit: "chi" as const,
  pricePerUnit: "400",
  currency: "USD" as const,
  transactionDate: "2026-01-20",
};

function snap(date: string, pricePerTroyOz: string) {
  return { t: new Date(date).getTime(), pricePerTroyOz };
}

describe("buildPortfolioSeries", () => {
  it("returns one point per snapshot, oldest first", () => {
    const series = buildPortfolioSeries(
      [BUY_10_CHI_3000],
      [snap("2026-01-25", "2000"), snap("2026-01-15", "2000")],
    );
    expect(series.map((p) => p.t)).toEqual([
      new Date("2026-01-15").getTime(),
      new Date("2026-01-25").getTime(),
    ]);
  });

  it("is all zeros for a snapshot dated before any transaction", () => {
    const [point] = buildPortfolioSeries(
      [BUY_10_CHI_3000],
      [snap("2026-01-05", "2000")],
    );
    expect(point.marketValueUsd).toBe("0");
    expect(point.costBasisUsd).toBe("0");
  });

  it("values holdings at the snapshot price once the buy has happened", () => {
    const [point] = buildPortfolioSeries(
      [BUY_10_CHI_3000],
      [snap("2026-01-15", "2000")],
    );
    // 10 chi bought for a $3000 total → cost basis is that $3000.
    expect(Number(point.costBasisUsd)).toBeCloseTo(3000, 6);
    // Market value = 10 chi in troy oz × $2000/oz.
    expect(Number(point.marketValueUsd)).toBeCloseTo(
      Number(toTroyOz("10", "chi")) * 2000,
      6,
    );
  });

  it("replays a later sell: quantity drops, average cost per unit holds", () => {
    const [point] = buildPortfolioSeries(
      [BUY_10_CHI_3000, SELL_3_CHI_1200],
      [snap("2026-01-25", "2100")],
    );
    // 7 chi left at the unchanged $300/chi average → $2100 cost basis.
    expect(Number(point.costBasisUsd)).toBeCloseTo(2100, 6);
    expect(Number(point.marketValueUsd)).toBeCloseTo(
      Number(toTroyOz("7", "chi")) * 2100,
      6,
    );
  });

  it("counts a transaction dated the same day as the snapshot", () => {
    const [point] = buildPortfolioSeries(
      [BUY_10_CHI_3000],
      [snap("2026-01-10", "2000")],
    );
    expect(Number(point.costBasisUsd)).toBeCloseTo(3000, 6);
  });

  it("ignores KHR rows, matching the rest of the calc layer", () => {
    const [point] = buildPortfolioSeries(
      [
        { ...BUY_10_CHI_3000, currency: "KHR" as const },
      ],
      [snap("2026-01-15", "2000")],
    );
    expect(point.costBasisUsd).toBe("0");
    expect(point.marketValueUsd).toBe("0");
  });

  it("returns an empty series when there are no snapshots", () => {
    expect(buildPortfolioSeries([BUY_10_CHI_3000], [])).toEqual([]);
  });
});
