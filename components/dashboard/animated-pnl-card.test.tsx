// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AnimatedPnlCard } from "./animated-pnl-card";

const KEY = "goldkh-last-pnl";

// motion/react is mocked in vitest.setup.ts (useReducedMotion -> true), so
// the roll snaps straight to the final value; the localStorage bookkeeping
// still runs.
describe("AnimatedPnlCard", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("renders the gain value and percent in the gain tone", () => {
    render(
      <AnimatedPnlCard
        label="Unrealized Gain/Loss"
        gainLossUsd="1250.5"
        gainLossPercent="4.2"
      />
    );
    const value = screen.getByText("$1,250.50");
    expect(value).toBeInTheDocument();
    expect(value).toHaveClass("text-state-gain");
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === "SPAN" &&
          el.classList.contains("font-mono") &&
          el.textContent === "+4.20%"
      )
    ).toHaveClass("text-state-gain");
  });

  it("renders a loss value in the destructive tone", () => {
    render(
      <AnimatedPnlCard
        label="Unrealized Gain/Loss"
        gainLossUsd="-80"
        gainLossPercent="-1.5"
      />
    );
    const value = screen.getByText(
      (_, el) =>
        el?.tagName === "SPAN" &&
        el.classList.contains("font-mono") &&
        el.textContent === "-$80.00"
    );
    expect(value).toHaveClass("text-destructive");
  });

  it("persists the current value for the next visit's starting point", () => {
    render(
      <AnimatedPnlCard
        label="Unrealized Gain/Loss"
        gainLossUsd="42"
        gainLossPercent="1"
      />
    );
    expect(window.localStorage.getItem(KEY)).toBe("42");
  });

  it("still shows the current value when a different value was stored", () => {
    window.localStorage.setItem(KEY, "10");
    render(
      <AnimatedPnlCard
        label="Unrealized Gain/Loss"
        gainLossUsd="99"
        gainLossPercent="3"
      />
    );
    expect(screen.getByText("$99.00")).toBeInTheDocument();
    expect(window.localStorage.getItem(KEY)).toBe("99");
  });

  it("marks a loss with a tone left-border and a signed value", () => {
    const { container } = render(
      <AnimatedPnlCard label="Unrealized Gain/Loss" gainLossUsd="-285" gainLossPercent="-5.1" />
    );
    expect(container.querySelector(".border-l-destructive")).not.toBeNull();
    expect(container.querySelector("[data-sign-cell]")).not.toBeNull();
  });
});
