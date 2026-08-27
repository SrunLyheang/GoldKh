// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { dictionary } from "@/lib/i18n/dictionary";
import { WelcomeLanding } from "./welcome-landing";

// Render the signed-out view. (useLocale is already mocked to English
// globally in vitest.setup.ts.)
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: false }),
}));

const w = dictionary.en.welcome;

describe("WelcomeLanding", () => {
  it("leads with the hero headline", () => {
    render(<WelcomeLanding />);
    expect(screen.getByRole("heading", { name: w.hero.headline })).toBeInTheDocument();
  });

  it("points every signed-out primary CTA at /sign-up", () => {
    render(<WelcomeLanding />);
    const ctas = screen.getAllByRole("link", { name: new RegExp(w.nav.getStarted, "i") });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", "/sign-up");
    }
  });

  it("links Sign in to /sign-in", () => {
    render(<WelcomeLanding />);
    const [signIn] = screen.getAllByRole("link", { name: w.nav.signIn });
    expect(signIn).toHaveAttribute("href", "/sign-in");
  });

  it("does not show the signed-in dashboard CTA when signed out", () => {
    render(<WelcomeLanding />);
    expect(
      screen.queryByRole("link", { name: w.nav.goToDashboard })
    ).not.toBeInTheDocument();
  });

  it("shows the product sample tagged as a sample, not live data", () => {
    render(<WelcomeLanding />);
    expect(screen.getByText(w.hero.sampleTag)).toBeInTheDocument();
  });

  it("states plainly that it is not an exchange", () => {
    render(<WelcomeLanding />);
    expect(screen.getByText(w.trust.notExchange)).toBeInTheDocument();
  });
});
