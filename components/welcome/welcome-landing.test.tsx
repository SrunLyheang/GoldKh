// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WelcomeLanding } from "./welcome-landing";

// Mutable auth state so individual tests can flip to the signed-in view.
const authState = { isLoaded: true, isSignedIn: false };

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => authState,
}));

afterEach(() => {
  authState.isSignedIn = false;
});

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

  it("renders the primary sign up CTAs pointing to /sign-up", () => {
    render(<WelcomeLanding />);
    const ctas = screen.getAllByRole("link", {
      name: /Get Started|Sign up|Create Free Account/i,
    });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", "/sign-up");
    }
  });

  it("links Log in to /sign-in", () => {
    render(<WelcomeLanding />);
    const signIns = screen.getAllByRole("link", { name: /Log in/i });
    expect(signIns.length).toBeGreaterThan(0);
    for (const link of signIns) {
      expect(link).toHaveAttribute("href", "/sign-in");
    }
  });

  it("does not show a dashboard CTA when signed out", () => {
    render(<WelcomeLanding />);
    expect(
      screen.queryByRole("link", { name: /Go to Dashboard/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a dashboard CTA and hides sign-in/sign-up when signed in", () => {
    authState.isSignedIn = true;
    render(<WelcomeLanding />);
    const dash = screen.getAllByRole("link", {
      name: /Go to Dashboard|Start Today/i,
    });
    expect(dash.length).toBeGreaterThan(0);
    for (const link of dash) {
      expect(link).toHaveAttribute("href", "/dashboard");
    }
    expect(
      screen.queryByRole("link", { name: /Log in/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: /Get Started|Sign up|Create Free Account|Start Today/i,
      }),
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
