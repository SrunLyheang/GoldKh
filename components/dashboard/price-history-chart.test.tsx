// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { PriceHistoryChart } from "./price-history-chart";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

// Recharts needs a sized container in jsdom; ResponsiveContainer renders
// nothing without one. These assertions target the header/notes/links,
// which are plain DOM outside the chart area, so a zero-size container is
// fine.
const points: ChartPoint[] = [
  { date: "2026-08-28T09:00:00Z", pricePerDamlung: 2800 },
  { date: "2026-08-28T15:00:00Z", pricePerDamlung: 2820 },
];

describe("PriceHistoryChart section-title link", () => {
  it("links the section title to /dashboard/price", () => {
    render(<PriceHistoryChart points={points} />);
    const link = screen.getByRole("link", { name: /price history/i });
    expect(link).toHaveAttribute("href", "/dashboard/price");
  });

  it("drills into /dashboard/price from the compact Expand control", async () => {
    render(<PriceHistoryChart points={points} />);
    await userEvent.click(screen.getByRole("button", { name: /expand ↗/i }));
    expect(pushMock).toHaveBeenCalledWith("/dashboard/price");
  });
});

describe("PriceHistoryChart market-closed state", () => {
  it("shows no market-closed badge or note while the market is open", () => {
    render(<PriceHistoryChart points={points} marketOpen />);
    expect(screen.queryByText("Market closed")).not.toBeInTheDocument();
    expect(screen.queryByText(/Trading resumes Monday/)).not.toBeInTheDocument();
  });

  it("shows the badge and the note when the market is closed", () => {
    render(<PriceHistoryChart points={points} marketOpen={false} />);
    expect(screen.getByText("Market closed")).toBeInTheDocument();
    expect(
      screen.getByText(/Showing the last price from Friday's close/),
    ).toBeInTheDocument();
  });

  it("still shows the closed badge and empty label with too little history", () => {
    render(<PriceHistoryChart points={points.slice(0, 1)} marketOpen={false} />);
    expect(screen.getByText("Market closed")).toBeInTheDocument();
    expect(screen.getByText(/Not enough price history/)).toBeInTheDocument();
  });
});

describe("PriceHistoryChart break-even caption", () => {
  it("describes the break-even line as pinned when the average cost is off scale", () => {
    render(<PriceHistoryChart points={points} breakEvenPerDamlung={99999} />);
    expect(
      screen.getByText(/is above this range — the dashed line is pinned/),
    ).toBeInTheDocument();
  });

  it("describes the break-even line normally when it sits within the price range", () => {
    render(<PriceHistoryChart points={points} breakEvenPerDamlung={2810} />);
    expect(
      screen.getByText(/Dashed line = your average cost/),
    ).toBeInTheDocument();
  });

  it("shows no caption without a position", () => {
    render(<PriceHistoryChart points={points} />);
    expect(screen.queryByText(/your average cost/i)).not.toBeInTheDocument();
  });
});
