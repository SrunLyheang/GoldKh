// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { WhatIf } from "./what-if";

const EMPTY_HOLDINGS = { totalTroyOz: "0", averageCostPerTroyOz: "0" };

describe("WhatIf", () => {
  it("shows the empty hint until both quantity and price are entered", () => {
    render(<WhatIf holdings={EMPTY_HOLDINGS} />);
    expect(
      screen.getByText("Enter a quantity and price to see the result."),
    ).toBeInTheDocument();
  });

  it("recomputes the blended position as the inputs change", async () => {
    const user = userEvent.setup();
    render(<WhatIf holdings={EMPTY_HOLDINGS} />);

    await user.type(screen.getByLabelText("Quantity"), "1");
    await user.type(screen.getByLabelText("Total price"), "5000");

    // 1 damlung for $5000 from an empty position → $5000/damlung, which is
    // both the new average cost and the break-even spot.
    expect(screen.getAllByText("$5,000.00")).toHaveLength(2);
    // 1 damlung = 10 chi.
    expect(screen.getByText(/10 Chi/)).toBeInTheDocument();
    expect(
      screen.queryByText("Enter a quantity and price to see the result."),
    ).not.toBeInTheDocument();
  });
});
