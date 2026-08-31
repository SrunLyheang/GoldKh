// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroToDashboard } from "./hero-to-dashboard";

// vitest.setup.ts mocks motion/react's useReducedMotion() -> true, so the
// component takes its `StaticBridge` branch: the finished, flat state
// with no springs, pointer listeners or infinite loops. jsdom also has
// no IntersectionObserver, so `useInView` resolves visible immediately
// and `useCountUp` snaps — every figure renders at its final value.

describe("HeroToDashboard", () => {
  it("renders the labelled bridge section and thesis copy", () => {
    render(<HeroToDashboard />);
    expect(
      screen.getByRole("region", { name: "How a ledger comes together" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your buys roll up into one position."),
    ).toBeInTheDocument();
  });

  it("shows all four position tiles", () => {
    render(<HeroToDashboard />);
    for (const label of ["Average cost", "You hold", "Worth now", "Up / down"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders figures at their final counted value, not zero", () => {
    const { container } = render(<HeroToDashboard />);
    const text = container.textContent ?? "";
    // The demo ledger is a gain against indicative spot.
    expect(text).toMatch(/\+\$[\d,]/);
    expect(text).not.toContain("$0.00");
  });

  it("leaves the stat tiles fully visible under reduced motion", () => {
    render(<HeroToDashboard />);
    const tile = screen.getByText("Average cost").closest("div");
    expect(tile).not.toBeNull();
    expect(tile!.style.opacity).toBe("1");
  });
});
