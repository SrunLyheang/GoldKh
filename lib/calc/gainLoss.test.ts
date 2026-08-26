import { describe, expect, it } from "vitest";
import { computeGainLoss } from "./gainLoss";

describe("computeGainLoss", () => {
  it("reports zero gain/loss when current price equals average cost", () => {
    const result = computeGainLoss("1", "2000", "2000");
    expect(result.gainLossUsd).toBe("0");
    expect(result.gainLossPercent).toBe("0");
  });

  it("reports a positive gain when the current price is above cost", () => {
    const result = computeGainLoss("1", "2000", "2200");
    expect(Number(result.gainLossUsd)).toBeCloseTo(200, 6);
    expect(Number(result.gainLossPercent)).toBeCloseTo(10, 6);
  });

  it("reports a negative gain (loss) when the current price is below cost", () => {
    const result = computeGainLoss("1", "2000", "1800");
    expect(Number(result.gainLossUsd)).toBeCloseTo(-200, 6);
    expect(Number(result.gainLossPercent)).toBeCloseTo(-10, 6);
  });

  it("returns a zero percent (not NaN or Infinity) when there is no cost basis", () => {
    const result = computeGainLoss("0", "0", "2000");
    expect(result.gainLossPercent).toBe("0");
    expect(result.marketValueUsd).toBe("0");
  });

  it("scales market value with quantity", () => {
    const one = computeGainLoss("1", "2000", "2000");
    const two = computeGainLoss("2", "2000", "2000");
    expect(Number(two.marketValueUsd)).toBeCloseTo(
      Number(one.marketValueUsd) * 2,
      6
    );
  });
});
