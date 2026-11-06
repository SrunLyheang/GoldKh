import { describe, expect, it } from "vitest";
import { formatDamlungChi, formatKhr } from "./money";
import { formatEntryDate } from "./datetime";

describe("formatEntryDate", () => {
  const now = new Date(Date.UTC(2026, 10, 6));
  it("writes this year's dates as day and month", () => {
    expect(formatEntryDate("2026-09-12", now)).toBe("12 Sep");
  });
  it("adds the year for other years", () => {
    expect(formatEntryDate("2025-11-21", now)).toBe("21 Nov 2025");
  });
});

describe("formatKhr", () => {
  it("prints whole riel, grouped, with the KHR code", () => {
    expect(formatKhr("16500000")).toBe("16,500,000 KHR");
    expect(formatKhr("1650000.4")).toBe("1,650,000 KHR");
  });
});

describe("formatDamlungChi", () => {
  it("says a weight the way it's said at the shop", () => {
    expect(formatDamlungChi("25")).toBe("2 damlung 5 chi");
    expect(formatDamlungChi("20")).toBe("2 damlung");
    expect(formatDamlungChi("7.5")).toBe("7.5 chi");
    expect(formatDamlungChi("20.5")).toBe("2 damlung 0.5 chi");
  });

  it("never rounds away an entered digit", () => {
    expect(formatDamlungChi("10.0001")).toBe("1 damlung 0.0001 chi");
  });

  it("reads an empty position as 0 chi", () => {
    expect(formatDamlungChi("0")).toBe("0 chi");
  });
});
