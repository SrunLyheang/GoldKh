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
      screen.getByRole("heading", { name: /see what your gold/i })
    ).toBeInTheDocument();
  });

  it("renders the brand wordmark GoldKh", () => {
    render(<WelcomeLanding />);
    expect(screen.getAllByText(/GoldKh/i).length).toBeGreaterThan(0);
  });

  it("renders public navigation anchor links", () => {
    render(<WelcomeLanding />);
    expect(screen.getAllByText(/Features/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/How It Works/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cambodian Units/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/About/i).length).toBeGreaterThan(0);
  });

  it("renders the primary sign up CTAs pointing to /sign-up", () => {
    render(<WelcomeLanding />);
    const ctas = screen.getAllByRole("link", { name: /Start Today|Begin Now|Create Free Account/i });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", "/sign-up");
    }
  });

  it("links Log in to /sign-in", () => {
    render(<WelcomeLanding />);
    const signIns = screen.getAllByRole("link", { name: /Log in/i });
    expect(signIns.length).toBeGreaterThan(0);
    expect(signIns[0]).toHaveAttribute("href", "/sign-in");
  });

  it("does not show a dashboard CTA when signed out", () => {
    render(<WelcomeLanding />);
    expect(
      screen.queryByRole("link", { name: /Go to Dashboard/i })
    ).not.toBeInTheDocument();
  });

  it("shows a dashboard CTA and hides sign-in/sign-up when signed in", () => {
    authState.isSignedIn = true;
    render(<WelcomeLanding />);
    const dash = screen.getAllByRole("link", { name: /Go to Dashboard/i });
    expect(dash.length).toBeGreaterThan(0);
    for (const link of dash) {
      expect(link).toHaveAttribute("href", "/dashboard");
    }
    expect(screen.queryByRole("link", { name: /Log in/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Begin Now|Create Free Account/i })
    ).not.toBeInTheDocument();
  });

  it("renders the unit calculator widget", () => {
    render(<WelcomeLanding />);
    expect(
      screen.getByText(/Unit Value Calculator/i)
    ).toBeInTheDocument();
  });

  it("marks the calculator price as indicative, not live", () => {
    render(<WelcomeLanding />);
    expect(screen.getByText(/not a live feed/i)).toBeInTheDocument();
  });
});
