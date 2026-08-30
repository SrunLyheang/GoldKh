// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { PriceHistoryChart } from "./price-history-chart";

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
});
