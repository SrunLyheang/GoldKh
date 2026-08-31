import { describe, expect, it } from "vitest";
import { computeBuyQuality } from "./buyQuality";
import { priceToTroyOz } from "./units";

function snap(date: string, pricePerTroyOz: string) {
  return { t: new Date(date).getTime(), pricePerTroyOz };
}

// A snapshot whose spot works out to exactly `perDamlung` USD/damlung.
function snapPerDamlung(date: string, perDamlung: string) {
  return snap(date, priceToTroyOz(perDamlung, "damlung"));
}

const BUY = {
  type: "buy" as const,
  quantity: "2",
  unit: "damlung" as const,
  pricePerUnit: "5000",
  currency: "USD" as const,
  transactionDate: "2026-02-10",
};

describe("computeBuyQuality", () => {
  it("reports paid = quantity × price per unit", () => {
    const [row] = computeBuyQuality([BUY], []);
    expect(Number(row.paidUsd)).toBeCloseTo(10000, 6);
    expect(row.spotPerUnitUsd).toBeNull();
    expect(row.vsSpotPercent).toBeNull();
  });

  it("uses the nearest snapshot at or before the buy date", () => {
    const [row] = computeBuyQuality(
      [BUY],
      [
        snapPerDamlung("2026-02-01", "4000"),
        snapPerDamlung("2026-02-09", "5000"), // nearest before → this one
        snapPerDamlung("2026-02-12", "9999"), // after the buy → ignored
      ],
    );
    expect(Number(row.spotPerUnitUsd)).toBeCloseTo(5000, 4);
  });

  it("is zero vs spot when the buy price equals spot on that date", () => {
    const [row] = computeBuyQuality([BUY], [snapPerDamlung("2026-02-09", "5000")]);
    expect(Number(row.vsSpotPercent)).toBeCloseTo(0, 6);
  });

  it("is positive when bought below spot (a good buy)", () => {
    // Spot 10000/damlung, paid 5000/damlung → (10000-5000)/5000 = +100%.
    const [row] = computeBuyQuality([BUY], [snapPerDamlung("2026-02-09", "10000")]);
    expect(Number(row.vsSpotPercent)).toBeCloseTo(100, 4);
  });

  it("is negative when bought above spot", () => {
    // Spot 4000/damlung, paid 5000/damlung → (4000-5000)/5000 = -20%.
    const [row] = computeBuyQuality([BUY], [snapPerDamlung("2026-02-09", "4000")]);
    expect(Number(row.vsSpotPercent)).toBeCloseTo(-20, 4);
  });

  it("leaves spot null when no snapshot is old enough", () => {
    const [row] = computeBuyQuality([BUY], [snapPerDamlung("2026-02-20", "5000")]);
    expect(row.spotPerUnitUsd).toBeNull();
    expect(row.vsSpotPercent).toBeNull();
  });

  it("includes only USD buys — sells and KHR rows are dropped", () => {
    const rows = computeBuyQuality(
      [
        BUY,
        { ...BUY, type: "sell" as const },
        { ...BUY, currency: "KHR" as const },
      ],
      [],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("buy");
  });

  it("preserves input order of the buys", () => {
    const rows = computeBuyQuality(
      [
        { ...BUY, transactionDate: "2026-03-01" },
        { ...BUY, transactionDate: "2026-01-01" },
      ],
      [],
    );
    expect(rows.map((r) => r.transactionDate)).toEqual([
      "2026-03-01",
      "2026-01-01",
    ]);
  });
});
