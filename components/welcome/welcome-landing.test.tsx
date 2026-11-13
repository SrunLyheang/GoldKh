// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WelcomeLanding } from "./welcome-landing";

describe("WelcomeLanding / LiquidGlassLanding", () => {
  it("renders the main headline", () => {
    render(<WelcomeLanding />);
    expect(
      screen.getByRole("heading", { name: /see what your gold/i }),
    ).toBeInTheDocument();
  });

  it("renders the brand wordmark GoldKh", () => {
    render(<WelcomeLanding />);
    expect(screen.getAllByText(/GoldKh/i).length).toBeGreaterThan(0);
  });

  it("renders public navigation anchor links", () => {
    render(<WelcomeLanding />);
    const features = screen.getAllByRole("link", { name: /^Features$/i });
    const how = screen.getAllByRole("link", { name: /^How It Works$/i });
    const units = screen.getAllByRole("link", { name: /^Cambodian Units$/i });
    const about = screen.getAllByRole("link", { name: /^About$/i });

    for (const link of features)
      expect(link).toHaveAttribute("href", "#features");
    for (const link of how)
      expect(link).toHaveAttribute("href", "#how-it-works");
    for (const link of units) expect(link).toHaveAttribute("href", "#units");
    for (const link of about) expect(link).toHaveAttribute("href", "#about");
  });

  // No sign-up: every call to action opens the app directly.
  it("points every call to action at /dashboard", () => {
    render(<WelcomeLanding />);
    const ctas = screen.getAllByRole("link", {
      name: /Start logging|Open the app|Build your real ledger/i,
    });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", "/dashboard");
    }
  });

  it("has no sign-in or sign-up links", () => {
    const { container } = render(<WelcomeLanding />);
    expect(
      container.querySelector('a[href^="/sign-in"], a[href^="/sign-up"]'),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: /Log in|Sign up/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the interactive Try It simulator", () => {
    render(<WelcomeLanding />);
    expect(
      screen.getByRole("heading", { name: /drag the price and watch your position/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Drag today's price/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add to ledger/i }),
    ).toBeInTheDocument();
  });

  it("marks the landing figures as indicative, not live", () => {
    render(<WelcomeLanding />);
    expect(
      screen.getAllByText(/indicative price for illustration only/i).length,
    ).toBeGreaterThan(0);
  });
});
