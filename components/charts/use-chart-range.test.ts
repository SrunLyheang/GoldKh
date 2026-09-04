import { describe, expect, it } from "vitest";
import { panWindow } from "./use-chart-range";

// panWindow(dx, start, end, lastIndex, plotWidth) → [start, end], shifted by
// the drag distance as a fraction of the window's own span, then slid back
// inside [0, lastIndex] without changing width. plotWidth 164 → plot 100.

describe("panWindow", () => {
  it("dragging left advances the window (later data)", () => {
    // span 10, drag -50px over a 100px plot = -0.5 span = -5 → +5 forward
    expect(panWindow(-50, 20, 30, 100, 164)).toEqual([25, 35]);
  });

  it("dragging right rewinds the window (earlier data)", () => {
    expect(panWindow(50, 20, 30, 100, 164)).toEqual([15, 25]);
  });

  it("clamps at the start without shrinking the window", () => {
    const [s, e] = panWindow(500, 5, 15, 100, 164);
    expect(s).toBe(0);
    expect(e - s).toBe(10);
  });

  it("clamps at the end without shrinking the window", () => {
    const [s, e] = panWindow(-500, 80, 90, 100, 164);
    expect(e).toBe(100);
    expect(e - s).toBe(10);
  });

  it("guards a zero/degenerate plot width instead of dividing by zero", () => {
    const [s, e] = panWindow(-10, 20, 30, 100, 0);
    expect(Number.isFinite(s)).toBe(true);
    expect(Number.isFinite(e)).toBe(true);
  });
});
