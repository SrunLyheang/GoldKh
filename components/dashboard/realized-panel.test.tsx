// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RealizedPanel } from "./realized-panel";

describe("RealizedPanel", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("shows the realized amount and percent with a loss tone when negative", () => {
    render(
      <RealizedPanel
        realizedUsd="-285"
        realizedPercent="-5.1029"
        saleCount={1}
      />
    );
    const value = screen.getByText(
      (_, el) =>
        el?.tagName === "SPAN" &&
        el.classList.contains("font-mono") &&
        el.textContent === "-$285.00"
    );
    expect(value).toBeInTheDocument();
    expect(value.className).toContain("text-destructive");
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === "SPAN" &&
          el.classList.contains("font-mono") &&
          el.textContent === "-5.10%"
      )
    ).toBeInTheDocument();
  });

  it("uses a gain tone when positive", () => {
    render(
      <RealizedPanel realizedUsd="300" realizedPercent="33.33" saleCount={2} />
    );
    expect(screen.getByText("$300.00").className).toContain("text-state-gain");
  });

  it("renders neutral, no gain/loss colour, at exactly break-even", () => {
    render(
      <RealizedPanel realizedUsd="0" realizedPercent="0" saleCount={1} />
    );
    const value = screen.getByText("$0.00");
    expect(value.className).not.toContain("text-destructive");
    expect(value.className).not.toContain("text-state-gain");
  });

  it("pluralises the sale count", () => {
    const { rerender } = render(
      <RealizedPanel realizedUsd="10" realizedPercent="1" saleCount={1} />
    );
    expect(screen.getByText(/from 1 sale$/)).toBeInTheDocument();

    rerender(
      <RealizedPanel realizedUsd="10" realizedPercent="1" saleCount={3} />
    );
    expect(screen.getByText(/from 3 sales$/)).toBeInTheDocument();
  });

  it("explains that held gold is excluded", () => {
    render(
      <RealizedPanel realizedUsd="10" realizedPercent="1" saleCount={1} />
    );
    expect(
      screen.getByText(/Gold you still hold isn't counted here/)
    ).toBeInTheDocument();
  });

  it("renders the value with a reserved sign cell", () => {
    const { container } = render(
      <RealizedPanel realizedUsd="-285" realizedPercent="-5.1" saleCount={1} />
    );
    expect(container.querySelector("[data-sign-cell]")).not.toBeNull();
  });

  it("hides the figure and caption when the header toggle is clicked", async () => {
    const user = userEvent.setup();
    render(
      <RealizedPanel realizedUsd="300" realizedPercent="10" saleCount={1} />
    );

    expect(screen.getByText("$300.00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide realized figure/i }));

    expect(screen.queryByText("$300.00")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Gold you still hold isn't counted here/)
    ).not.toBeInTheDocument();
    // The label stays as the affordance to bring it back.
    expect(screen.getByText(/from 1 sale$/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show realized figure/i }));
    expect(screen.getByText("$300.00")).toBeInTheDocument();
  });

  it("stays collapsed on remount once hidden (persisted)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <RealizedPanel realizedUsd="300" realizedPercent="10" saleCount={2} />
    );

    await user.click(screen.getByRole("button", { name: /hide realized figure/i }));
    expect(screen.queryByText("$300.00")).not.toBeInTheDocument();
    unmount();

    render(<RealizedPanel realizedUsd="300" realizedPercent="10" saleCount={2} />);
    expect(screen.queryByText("$300.00")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /show realized figure/i })
    ).toHaveAttribute("aria-expanded", "false");
  });
});
