// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import {
  PriceHistoryChart,
  computeYAxis,
  placeBreakEven,
} from "./price-history-chart";

// Recharts needs a sized container in jsdom; ResponsiveContainer renders
// nothing without one. These assertions target the header/notes, which are
// plain DOM outside the chart area, so a zero-size container is fine.
const points: ChartPoint[] = [
  { date: "2026-08-28T09:00:00Z", pricePerDamlung: 2800 },
  { date: "2026-08-28T15:00:00Z", pricePerDamlung: 2820 },
];

describe("PriceHistoryChart market-closed state", () => {
  it("shows no market-closed badge or note while the market is open", () => {
    render(<PriceHistoryChart points={points} marketOpen />);
    expect(screen.queryByText("Market closed")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Trading resumes Monday/)
    ).not.toBeInTheDocument();
  });

  it("shows the badge and the note when the market is closed", () => {
    render(<PriceHistoryChart points={points} marketOpen={false} />);
    expect(screen.getByText("Market closed")).toBeInTheDocument();
    expect(
      screen.getByText(/Showing the last price from Friday's close/)
    ).toBeInTheDocument();
  });

  it("still shows the closed badge when there is not enough history to draw a line", () => {
    render(
      <PriceHistoryChart points={points.slice(0, 1)} marketOpen={false} />
    );
    expect(screen.getByText("Market closed")).toBeInTheDocument();
    expect(screen.getByText(/Not enough price history/)).toBeInTheDocument();
  });

  it("describes the break-even line as pinned when the average cost is off scale", () => {
    render(<PriceHistoryChart points={points} breakEvenPerDamlung={99999} />);
    expect(
      screen.getByText(/is above this range — the dashed line is pinned/)
    ).toBeInTheDocument();
  });

  it("describes the break-even line normally when it sits within the price range", () => {
    render(<PriceHistoryChart points={points} breakEvenPerDamlung={2810} />);
    expect(
      screen.getByText(/Dashed line = your average cost/)
    ).toBeInTheDocument();
  });
});

describe("computeYAxis", () => {
  it("sizes the domain from the price series with padding, ignoring anything else", () => {
    const { domain } = computeYAxis(points);
    expect(domain[0]).toBeLessThan(2800);
    expect(domain[1]).toBeGreaterThan(2820);
    // A wild break-even value is NOT part of the series, so it can't
    // widen the domain — that is the whole point of issue #4.
    expect(domain[1]).toBeLessThan(3000);
  });

  it("stays finite when every point has the same value", () => {
    const flat: ChartPoint[] = [
      { date: "2026-08-28T09:00:00Z", pricePerDamlung: 2800 },
      { date: "2026-08-28T15:00:00Z", pricePerDamlung: 2800 },
    ];
    const { domain, ticks } = computeYAxis(flat);
    expect(domain[0]).toBeLessThan(2800);
    expect(domain[1]).toBeGreaterThan(2800);
    expect(ticks.length).toBeGreaterThan(0);
  });
});

describe("placeBreakEven", () => {
  const domain: [number, number] = [2790, 2830];

  it("returns null when there is no break-even value", () => {
    expect(placeBreakEven(undefined, domain)).toBeNull();
  });

  it("keeps an in-range value on scale", () => {
    expect(placeBreakEven(2810, domain)).toEqual({
      actual: 2810,
      y: 2810,
      placement: "on-scale",
    });
  });

  it("clamps a value above the domain to the top edge", () => {
    expect(placeBreakEven(50000, domain)).toEqual({
      actual: 50000,
      y: 2830,
      placement: "above",
    });
  });

  it("clamps a value below the domain to the bottom edge", () => {
    expect(placeBreakEven(10, domain)).toEqual({
      actual: 10,
      y: 2790,
      placement: "below",
    });
  });
});
