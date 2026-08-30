// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RealizedPanel } from "./realized-panel";

describe("RealizedPanel", () => {
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
});
