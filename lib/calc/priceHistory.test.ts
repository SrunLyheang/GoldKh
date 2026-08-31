import { describe, expect, it } from "vitest";
import { buildDamlungPriceSeries, spotPerDamlungOnDate } from "./priceHistory";

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

describe("spotPerDamlungOnDate", () => {
  const points = [
    { date: "2026-08-01T10:00:00.000Z", pricePerDamlung: 100 },
    { date: "2026-08-03T10:00:00.000Z", pricePerDamlung: 120 },
    { date: "2026-08-03T20:00:00.000Z", pricePerDamlung: 125 },
    { date: "2026-08-06T10:00:00.000Z", pricePerDamlung: 140 },
  ];

  it("returns null when no snapshot is old enough", () => {
    expect(spotPerDamlungOnDate(points, "2026-07-30")).toBeNull();
    expect(spotPerDamlungOnDate([], "2026-08-01")).toBeNull();
  });

  it("returns the last snapshot at or before the end of that day", () => {
    expect(spotPerDamlungOnDate(points, "2026-08-01")).toBe(100);
    expect(spotPerDamlungOnDate(points, "2026-08-03")).toBe(125);
  });

  it("carries the most recent prior snapshot forward on a gap day", () => {
    expect(spotPerDamlungOnDate(points, "2026-08-05")).toBe(125);
  });
});
