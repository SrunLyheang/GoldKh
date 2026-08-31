// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { priceToTroyOz, toTroyOz } from "@/lib/calc/units";
import { WhatIf } from "./what-if";

const EMPTY_HOLDINGS = { totalTroyOz: "0", averageCostPerTroyOz: "0" };
// 2 damlung held at a $5,000/damlung average cost.
const HELD_2_DAMLUNG = {
  totalTroyOz: toTroyOz("2", "damlung"),
  averageCostPerTroyOz: priceToTroyOz("5000", "damlung"),
};
// Live spot quoted at $5,200 per damlung.
const SPOT = priceToTroyOz("5200", "damlung");

describe("WhatIf", () => {
  it("shows the empty hint until both quantity and price are entered", () => {
    render(<WhatIf holdings={EMPTY_HOLDINGS} pricePerTroyOz={SPOT} />);
    expect(
      screen.getByText("Enter a quantity and price to see the result."),
    ).toBeInTheDocument();
  });

  it("blends a hypothetical buy and shows the projected position", async () => {
    const user = userEvent.setup();
    render(<WhatIf holdings={EMPTY_HOLDINGS} pricePerTroyOz={SPOT} />);

    await user.type(screen.getByLabelText("Quantity"), "1");
    await user.type(screen.getByLabelText("Total price"), "5000");

    // 1 damlung for $5000 from an empty position → $5000/damlung
    // break-even spot, holding 1 damlung / 10 chi.
    const breakEvenRow = screen.getByText(/Break-even/).closest("div");
    expect(
      within(breakEvenRow as HTMLElement).getByText("$5,000.00"),
    ).toBeInTheDocument();
    expect(screen.getByText(/10 Chi/)).toBeInTheDocument();
    expect(
      screen.queryByText("Enter a quantity and price to see the result."),
    ).not.toBeInTheDocument();
  });

  it("fills the total price from the current spot when 'Use spot' is clicked", async () => {
    const user = userEvent.setup();
    render(<WhatIf holdings={EMPTY_HOLDINGS} pricePerTroyOz={SPOT} />);

    await user.type(screen.getByLabelText("Quantity"), "2");
    await user.click(screen.getByRole("button", { name: "Use spot" }));

    // 2 damlung at $5,200/damlung spot = $10,400.
    expect(screen.getByLabelText("Total price")).toHaveValue(10400);
  });

  it("switches to sell mode and shows proceeds and realized gain instead of break-even", async () => {
    const user = userEvent.setup();
    render(<WhatIf holdings={HELD_2_DAMLUNG} pricePerTroyOz={SPOT} />);

    await user.click(screen.getByRole("tab", { name: "Sell" }));
    await user.type(screen.getByLabelText("Quantity"), "1");
    await user.type(screen.getByLabelText("Total price"), "5300");

    expect(screen.getByText("Proceeds")).toBeInTheDocument();
    expect(screen.getByText("Realized gain / loss")).toBeInTheDocument();
    expect(screen.getByText("$5,300.00")).toBeInTheDocument();
    // Realized gain = 5300 − (1 × 5000) = +$300.
    expect(screen.getByText(/\+\$300\.00/)).toBeInTheDocument();
    expect(screen.queryByText("Break-even spot price")).not.toBeInTheDocument();
  });

  it("warns when a hypothetical sell exceeds the current position", async () => {
    const user = userEvent.setup();
    render(<WhatIf holdings={HELD_2_DAMLUNG} pricePerTroyOz={SPOT} />);

    await user.click(screen.getByRole("tab", { name: "Sell" }));
    await user.type(screen.getByLabelText("Quantity"), "5");
    await user.type(screen.getByLabelText("Total price"), "25000");

    expect(screen.getByText(/only hold/i)).toBeInTheDocument();
    expect(screen.queryByText("Proceeds")).not.toBeInTheDocument();
  });

  it("shows the signed change between the current and projected position", async () => {
    const user = userEvent.setup();
    render(<WhatIf holdings={HELD_2_DAMLUNG} pricePerTroyOz={SPOT} />);

    await user.type(screen.getByLabelText("Quantity"), "2");
    await user.type(screen.getByLabelText("Total price"), "12000");

    // Break-even spot moves $5,000 → $5,500 per damlung: a +$500.00 change.
    const breakEvenRow = screen.getByText(/Break-even/).closest("div");
    expect(breakEvenRow).not.toBeNull();
    expect(
      within(breakEvenRow as HTMLElement).getByText("+$500.00"),
    ).toBeInTheDocument();
  });
});
