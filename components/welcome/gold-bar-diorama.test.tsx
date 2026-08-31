// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GoldBarDiorama } from "./gold-bar-diorama";

// vitest.setup.ts mocks motion/react's useReducedMotion() -> true, so the
// diorama takes its static, listener-free branch: the stage is parked at a
// fixed three-quarter pose and every parallax layer sits at zero offset.
// No pointermove listener is attached and the rAF loop never starts.

describe("GoldBarDiorama", () => {
  it("renders a decorative, non-interactive layer that fills its card", () => {
    const { container } = render(<GoldBarDiorama />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.className).toContain("pointer-events-none");
    expect(root.className).toContain("absolute");
    expect(root.className).toContain("inset-0");
  });

  it("parks the stage at its resting three-quarter pose under reduced motion", () => {
    render(<GoldBarDiorama />);
    const stage = screen.getByTestId("gold-bar-diorama-stage");
    expect(stage.style.transform).toBe("rotateX(3deg) rotateY(-8deg)");
  });

  it("shows the gold-bar photo as the foreground layer", () => {
    render(<GoldBarDiorama />);
    const bar = screen.getByTestId("gold-bar-diorama-bar") as HTMLImageElement;
    expect(bar.tagName).toBe("IMG");
    expect(bar.getAttribute("src")).toContain("goldkh_hero_hand_gold");
    // Decorative: the surrounding CTA card carries the meaning.
    expect(bar).toHaveAttribute("alt", "");
  });

  it("renders the full depth stack", () => {
    render(<GoldBarDiorama />);
    for (const id of [
      "gold-bar-diorama-bed",
      "gold-bar-diorama-beam",
      "gold-bar-diorama-dust",
      "gold-bar-diorama-glow",
      "gold-bar-diorama-bar",
      "gold-bar-diorama-scrim",
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });
});
