import { describe, expect, it } from "vitest";
import { buildLandingQuote, type PricePoint } from "./quote";

const NOW = new Date("2026-11-13T07:05:00Z"); // 14:05 in Phnom Penh
// $3,110.34768/oz makes 1 gram exactly $100 and 1 damlung (37.5 g) $3,750.
const OZ = "3110.34768";

function point(pricePerTroyOz: string, hoursAgo: number): PricePoint {
  return {
    pricePerTroyOz,
    capturedAt: new Date(NOW.getTime() - hoursAgo * 3600_000),
  };
}

function build(overrides: Partial<Parameters<typeof buildLandingQuote>[0]> = {}) {
  return buildLandingQuote({
    latest: point(OZ, 0),
    isStale: false,
    marketOpen: true,
    yesterday: null,
    past: null,
    now: NOW,
    ...overrides,
  });
}

describe("buildLandingQuote", () => {
  it("quotes per damlung, chi and gram from one troy-ounce price", () => {
    const q = build();
    expect(q.perDamlung).toBe("$3,750.00");
    expect(q.perChi).toBe("$375.00");
    expect(q.perGram).toBe("$100.00");
  });

  it("formats the as-of time in Phnom Penh time", () => {
    const q = build();
    expect(q.asOf.en).toMatch(/2:05\s?PM/);
    expect(q.asOf.km).toBe("14:05");
    expect(q.asOfDay.en).toMatch(/^Fri 2:05\s?PM$/);
  });

  it("values each tray piece by its weight", () => {
    const q = build();
    expect(q.pieces.leaf1d).toBe("$3,750.00");
    expect(q.pieces.leaf5c).toBe("$1,875.00");
    expect(q.pieces.leaf1c).toBe("$375.00");
    expect(q.pieces.ring).toBe("$750.00");
    expect(q.pieces.chain).toBe("$3,750.00");
  });

  describe("change since yesterday", () => {
    it("reports the per-damlung move against a ~day-old snapshot", () => {
      // 1% lower a day ago: $3,712.50 per damlung.
      const q = build({ yesterday: point("3079.2442032", 24) });
      expect(q.change).toEqual({ direction: "up", amount: "$37.50" });
    });

    it("reports a fall as down with a positive amount", () => {
      const q = build({ yesterday: point("3141.4511568", 26) });
      expect(q.change).toEqual({ direction: "down", amount: "$37.50" });
    });

    it("treats a sub-cent wobble as flat", () => {
      const q = build({ yesterday: point("3110.3476801", 24) });
      expect(q.change?.direction).toBe("flat");
    });

    it("omits the comparison when the older snapshot is days old", () => {
      const q = build({ yesterday: point("3000", 72) });
      expect(q.change).toBeNull();
    });
  });

  describe("worked example", () => {
    it("values 2 damlung 3 chi bought at a past spot price", () => {
      // Past: $3,000 per damlung → paid $6,900; today worth $8,625.
      const q = build({ past: point("2488.278144", 24 * 30) });
      expect(q.example).toMatchObject({
        paidPerDamlung: "$3,000.00",
        worthToday: "$8,625.00",
        difference: "$1,725.00",
        direction: "up",
      });
      expect(q.example?.date.en).toBe("14 Oct 2026");
    });

    it("shows a loss as down", () => {
      const q = build({ past: point("3421.382448", 24 * 30) }); // $4,125/damlung
      expect(q.example?.direction).toBe("down");
      expect(q.example?.difference).toBe("$862.50");
    });

    it("is absent without an older snapshot", () => {
      expect(build().example).toBeNull();
    });
  });

  it("passes staleness and market state through", () => {
    const q = build({ isStale: true, marketOpen: false });
    expect(q.isStale).toBe(true);
    expect(q.marketOpen).toBe(false);
  });
});
