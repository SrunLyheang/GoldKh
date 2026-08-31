// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TryItSimulator } from "./try-it-simulator";

// Finds the value line of a stat tile by its label.
function tileValue(label: RegExp): string {
  const labelEl = screen.getByText(label);
  const tile = labelEl.parentElement as HTMLElement;
  return within(tile).getAllByText(/.+/)[1]?.textContent ?? "";
}

describe("TryItSimulator", () => {
  it("shows a seeded position with a non-zero average cost", () => {
    render(<TryItSimulator signedIn={false} />);
    // Two seed rows: 1 damlung + 5 chi.
    expect(screen.getByText(/1 damlung/)).toBeInTheDocument();
    expect(screen.getByText(/5 chi/)).toBeInTheDocument();
    expect(tileValue(/Average cost/)).toMatch(/\$4,\d{3}\.\d{2}/);
  });

  it("recomputes the weighted average when a buy is added", () => {
    render(<TryItSimulator signedIn={false} />);
    const before = tileValue(/Average cost/);

    fireEvent.change(screen.getByLabelText(/How much/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/Total paid/i), {
      target: { value: "12000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add to ledger/i }));

    expect(screen.getByText(/2 damlung/)).toBeInTheDocument();
    expect(tileValue(/Average cost/)).not.toEqual(before);
  });

  it("flips the gain/loss sign as the spot slider crosses the average cost", () => {
    render(<TryItSimulator signedIn={false} />);
    const slider = screen.getByLabelText(/Drag today's price/i);

    fireEvent.change(slider, { target: { value: "2500" } });
    expect(tileValue(/Up \/ down/)).toMatch(/^−\$/);

    fireEvent.change(slider, { target: { value: "7000" } });
    expect(tileValue(/Up \/ down/)).toMatch(/^\+\$/);
  });

  it("points the CTA at sign-up when signed out and the dashboard when signed in", () => {
    const { rerender } = render(<TryItSimulator signedIn={false} />);
    expect(
      screen.getByRole("link", { name: /Build your real ledger/i }),
    ).toHaveAttribute("href", "/sign-up");

    rerender(<TryItSimulator signedIn />);
    expect(
      screen.getByRole("link", { name: /Open your dashboard/i }),
    ).toHaveAttribute("href", "/dashboard");
  });
});
