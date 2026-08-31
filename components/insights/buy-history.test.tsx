// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BuyHistory } from "./buy-history";
import type { BuyQualityRow } from "@/lib/calc/buyQuality";

const row = (
  transactionDate: string,
  vsSpotPercent: string | null,
): BuyQualityRow => ({
  type: "buy",
  transactionDate,
  quantity: "1",
  unit: "damlung",
  paidUsd: "5000",
  pricePerUnitUsd: "5000",
  spotPerUnitUsd: vsSpotPercent === null ? null : "5000",
  vsSpotPercent,
});

describe("BuyHistory", () => {
  it("shows the empty message when there are no buys", () => {
    render(<BuyHistory rows={[]} />);
    expect(screen.getByText("No buys recorded yet.")).toBeInTheDocument();
  });

  it("renders a dash when spot on the buy date is unknown", () => {
    render(<BuyHistory rows={[row("2026-01-01", null)]} />);
    const body = screen.getAllByRole("row")[1];
    expect(within(body).getAllByText("—").length).toBeGreaterThan(0);
  });

  it("reorders rows when the vs-spot header is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BuyHistory
        rows={[row("2026-01-01", "-10"), row("2026-02-01", "40")]}
      />,
    );

    // Default sort: date descending → Feb row first.
    const datesBefore = screen
      .getAllByRole("row")
      .slice(1)
      .map((r) => within(r).getAllByRole("cell")[0].textContent);
    expect(datesBefore).toEqual(["2026-02-01", "2026-01-01"]);

    await user.click(screen.getByRole("button", { name: /vs spot/i }));

    // vs spot descending → +40% row first (still Feb), then -10% (Jan).
    const datesAfter = screen
      .getAllByRole("row")
      .slice(1)
      .map((r) => within(r).getAllByRole("cell")[0].textContent);
    expect(datesAfter).toEqual(["2026-02-01", "2026-01-01"]);

    await user.click(screen.getByRole("button", { name: /vs spot/i }));
    const datesAsc = screen
      .getAllByRole("row")
      .slice(1)
      .map((r) => within(r).getAllByRole("cell")[0].textContent);
    expect(datesAsc).toEqual(["2026-01-01", "2026-02-01"]);
  });
});
