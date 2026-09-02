// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DetailedChart,
  computeSeriesYAxis,
  mergeSeries,
  placeReferenceLine,
  presetCoversAll,
  presetRange,
  type ChartSeries,
} from "./detailed-chart";
import { notify } from "@/lib/ui/toast";

vi.mock("@/lib/ui/toast", () => ({
  notify: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

const DAY = 24 * 60 * 60 * 1000;

function priceSeries(
  values: number[],
  { start = 0, stepMs = DAY }: { start?: number; stepMs?: number } = {},
): ChartSeries {
  return {
    key: "price",
    label: "Spot price",
    color: "var(--chart-1)",
    data: values.map((value, i) => ({ t: start + i * stepMs, value })),
  };
}

describe("mergeSeries", () => {
  it("collapses multiple series onto rows keyed by timestamp, sorted", () => {
    const rows = mergeSeries([
      { key: "a", label: "A", color: "", data: [{ t: 200, value: 2 }, { t: 100, value: 1 }] },
      { key: "b", label: "B", color: "", data: [{ t: 100, value: 9 }] },
    ]);
    expect(rows).toEqual([
      { t: 100, a: 1, b: 9 },
      { t: 200, a: 2 },
    ]);
  });
});

describe("computeSeriesYAxis", () => {
  it("sizes the domain from series values with padding", () => {
    const rows = mergeSeries([priceSeries([2800, 2820])]);
    const { domain } = computeSeriesYAxis(rows, ["price"]);
    expect(domain[0]).toBeLessThan(2800);
    expect(domain[1]).toBeGreaterThan(2820);
    // A far-off reference value is not in the series, so it cannot widen
    // the domain — that is the whole point.
    expect(domain[1]).toBeLessThan(3000);
  });

  it("stays finite when every value is identical", () => {
    const rows = mergeSeries([priceSeries([2800, 2800])]);
    const { domain, ticks } = computeSeriesYAxis(rows, ["price"]);
    expect(domain[0]).toBeLessThan(2800);
    expect(domain[1]).toBeGreaterThan(2800);
    expect(ticks.length).toBeGreaterThan(0);
  });

  it("spans every key when there are multiple series", () => {
    const rows = mergeSeries([
      { key: "mkt", label: "", color: "", data: [{ t: 1, value: 100 }, { t: 2, value: 400 }] },
      { key: "cost", label: "", color: "", data: [{ t: 1, value: 50 }, { t: 2, value: 60 }] },
    ]);
    const { domain } = computeSeriesYAxis(rows, ["mkt", "cost"]);
    expect(domain[0]).toBeLessThan(50);
    expect(domain[1]).toBeGreaterThan(400);
  });
});

describe("placeReferenceLine", () => {
  const domain: [number, number] = [2790, 2830];

  it("keeps an in-range value on scale", () => {
    expect(placeReferenceLine(2810, domain)).toEqual({
      actual: 2810,
      y: 2810,
      placement: "on-scale",
    });
  });

  it("clamps a value above the domain to the top edge", () => {
    expect(placeReferenceLine(50000, domain)).toEqual({
      actual: 50000,
      y: 2830,
      placement: "above",
    });
  });

  it("clamps a value below the domain to the bottom edge", () => {
    expect(placeReferenceLine(10, domain)).toEqual({
      actual: 10,
      y: 2790,
      placement: "below",
    });
  });
});

describe("presetRange", () => {
  const now = 1_000 * DAY;
  // 5 points, 20 days apart, oldest 80 days back.
  const rows = mergeSeries([
    priceSeries([1, 2, 3, 4, 5], { start: now - 80 * DAY, stepMs: 20 * DAY }),
  ]);

  it("returns the full index span for All", () => {
    expect(presetRange(rows, "All", now)).toEqual([0, 4]);
  });

  it("clamps a window that reaches past the earliest datum to the full span", () => {
    // 3M (90 days) reaches before the oldest point (80 days) → clamp.
    expect(presetRange(rows, "3M", now)).toEqual([0, 4]);
  });

  it("starts at the first datum inside the window", () => {
    // 1W window: only the last datum (20 days apart) is newer than the cutoff.
    expect(presetRange(rows, "1W", now)).toEqual([4, 4]);
  });

  it("starts partway in when only some points predate the window", () => {
    // 1M (30 days): the last two points (0 and 20 days old) are inside.
    expect(presetRange(rows, "1M", now)).toEqual([3, 4]);
  });
});

describe("presetCoversAll", () => {
  const now = 1_000 * DAY;

  it("is true when the window already spans all data", () => {
    const rows = mergeSeries([priceSeries([1, 2, 3], { start: now - 2 * DAY })]);
    expect(presetCoversAll(rows, "1M", now)).toBe(true);
  });

  it("is false when data predates the window", () => {
    const rows = mergeSeries([priceSeries([1, 2], { start: now - 200 * DAY })]);
    expect(presetCoversAll(rows, "1W", now)).toBe(false);
  });
});

describe("DetailedChart rendering", () => {
  it("shows the empty label when there are fewer than 2 points", () => {
    render(
      <DetailedChart
        series={[priceSeries([2800])]}
        emptyLabel="Not enough price history yet"
      />,
    );
    expect(screen.getByText("Not enough price history yet")).toBeInTheDocument();
  });

  it("compact + richControls keeps the presets and range caption (Insights inline chart)", () => {
    render(
      <DetailedChart
        series={[priceSeries([10, 12, 14], { start: Date.now() - 60 * DAY, stepMs: 20 * DAY })]}
        compact
        richControls
      />,
    );
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByText(/Showing .+ – .+/)).toBeInTheDocument();
  });

  it("compact mode without richControls shows no presets", () => {
    render(<DetailedChart series={[priceSeries([10, 12, 14])]} compact />);
    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
  });

  it("compact mode renders an Expand affordance that calls onExpand", async () => {
    const onExpand = vi.fn();
    render(
      <DetailedChart series={[priceSeries([2800, 2810, 2820])]} compact onExpand={onExpand} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /expand ↗/i }));
    expect(onExpand).toHaveBeenCalled();
  });

  it("full mode marks the clicked preset active and shows a Reset control", async () => {
    const rows = [2800, 2810, 2820, 2830, 2840];
    render(
      <DetailedChart
        series={[priceSeries(rows, { start: Date.now() - 200 * DAY, stepMs: 40 * DAY })]}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /reset/i }),
    ).not.toBeInTheDocument();

    const oneWeek = screen.getByRole("button", { name: "1W" });
    expect(oneWeek).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(oneWeek);
    expect(oneWeek).toHaveAttribute("aria-pressed", "true");

    const reset = screen.getByRole("button", { name: /reset/i });
    await userEvent.click(reset);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: /reset/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the visible date range as a caption", () => {
    render(
      <DetailedChart
        series={[priceSeries([2800, 2810, 2820], { start: Date.now() - 60 * DAY, stepMs: 20 * DAY })]}
      />,
    );
    expect(screen.getByText(/Showing .+ – .+/)).toBeInTheDocument();
  });

  it("a preset whose window exceeds the history toasts instead of re-ranging", async () => {
    render(
      <DetailedChart
        series={[priceSeries([2800, 2810, 2820], { start: Date.now() - 2 * DAY })]}
      />,
    );
    const oneMonth = screen.getByRole("button", { name: "1M" });
    expect(oneMonth).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(oneMonth);
    expect(notify.info).toHaveBeenCalledWith(
      expect.stringMatching(/longer than your saved price history/i),
    );
    expect(oneMonth).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
