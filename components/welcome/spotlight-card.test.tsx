// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpotlightCard } from "./spotlight-card";

// vitest.setup.ts mocks motion/react's useReducedMotion() -> true, so
// SpotlightCard takes its static branch: it renders the card markup with
// no pointer listeners and the glow layer parked at --spot-opacity: 0.

describe("SpotlightCard", () => {
  it("renders its children inside a lifted content layer", () => {
    render(
      <SpotlightCard className="liquid-glass rounded-3xl">
        <p>step copy</p>
      </SpotlightCard>
    );
    const content = screen.getByText("step copy").parentElement as HTMLElement;
    expect(content.className).toContain("relative");
    expect(content.className).toContain("z-10");
  });

  it("passes the caller's classes through onto the card element", () => {
    const { container } = render(
      <SpotlightCard className="liquid-glass rounded-2xl border border-white/10">
        <span>x</span>
      </SpotlightCard>
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("spotlight-card");
    expect(card.className).toContain("liquid-glass");
    expect(card.className).toContain("rounded-2xl");
  });

  it("attaches no pointer handlers under reduced motion", () => {
    const { container } = render(
      <SpotlightCard>
        <span>x</span>
      </SpotlightCard>
    );
    const card = container.firstElementChild as HTMLElement;
    // No inline custom properties are written when tracking is disabled.
    expect(card.style.getPropertyValue("--spot-opacity")).toBe("");
  });
});
