// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollGoldBar } from "./scroll-gold-bar";

// vitest.setup.ts mocks motion/react's useReducedMotion() -> true, so the
// bar takes its static, loop-free branch: parked at its resting pose,
// with no scroll listener or rAF loop attached.

describe("ScrollGoldBar", () => {
  it("renders a decorative, non-interactive layer", () => {
    const { container } = render(<ScrollGoldBar />);
    const layer = container.firstElementChild as HTMLElement;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.className).toContain("pointer-events-none");
    expect(layer.className).toContain("fixed");
  });

  it("draws the bar as an unfilled wireframe outline", () => {
    render(<ScrollGoldBar />);
    const bar = screen.getByTestId("scroll-gold-bar");
    expect(bar.tagName.toLowerCase()).toBe("svg");
    expect(bar).toHaveAttribute("fill", "none");
    // front / top / right edges, no fills.
    expect(bar.querySelectorAll("path")).toHaveLength(3);
  });

  it("parks the bar at its resting pose under reduced motion", () => {
    render(<ScrollGoldBar />);
    const bar = screen.getByTestId("scroll-gold-bar");
    // Mid-point of the 24vh -> 62vh vertical travel, resting angle, on
    // its own composited layer (translateZ(0) — see REST_TRANSFORM).
    expect(bar.style.transform).toBe(
      "translate(-50%, calc(43vh - 50%)) rotate(-20deg) translateZ(0)",
    );
  });
});
