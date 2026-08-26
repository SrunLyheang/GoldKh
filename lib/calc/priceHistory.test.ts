import { describe, expect, it } from "vitest";
import { buildDamlungPriceSeries } from "./priceHistory";

describe("buildDamlungPriceSeries", () => {
  it("returns an empty series for no snapshots", () => {
    expect(buildDamlungPriceSeries([])).toEqual([]);
  });

  it("converts price per troy oz into price per damlung", () => {
    const result = buildDamlungPriceSeries([
      { capturedAt: new Date("2026-01-01T00:00:00Z"), pricePerTroyOz: "2000" },
    ]);

    expect(result).toHaveLength(1);
    // 1 damlung ≈ 1.2056 troy oz, so price/damlung > price/oz
    expect(result[0].pricePerDamlung).toBeGreaterThan(2000);
    expect(result[0].date).toBe("2026-01-01T00:00:00.000Z");
  });

  it("preserves input order", () => {
    const result = buildDamlungPriceSeries([
      { capturedAt: new Date("2026-01-01T00:00:00Z"), pricePerTroyOz: "2000" },
      { capturedAt: new Date("2026-01-02T00:00:00Z"), pricePerTroyOz: "2100" },
    ]);

    expect(result[1].pricePerDamlung).toBeGreaterThan(result[0].pricePerDamlung);
  });
});
