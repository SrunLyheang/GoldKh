// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeatureCoverflow } from "./feature-coverflow";

// vitest.setup.ts mocks motion/react into its reduced-motion branch and
// renders every motion element as a plain tag, so all four cards sit in
// the DOM at once. These tests assert on the live region and the dot
// controls rather than on visual position.

afterEach(() => {
  vi.useRealTimers();
});

function liveText(): string {
  return screen.getByText(/^Feature \d of 4:/).textContent ?? "";
}

describe("FeatureCoverflow", () => {
  it("renders all four features", () => {
    render(<FeatureCoverflow />);
    expect(screen.getByText("Your real average cost")).toBeInTheDocument();
    expect(screen.getByText("Works in Chi and Damlung")).toBeInTheDocument();
    expect(screen.getByText("Live spot price")).toBeInTheDocument();
    expect(screen.getByText("Up or down, at a glance")).toBeInTheDocument();
  });

  it("starts on the first feature", () => {
    render(<FeatureCoverflow />);
    expect(liveText()).toBe("Feature 1 of 4: Your real average cost");
  });

  it("advances to the next feature", () => {
    render(<FeatureCoverflow />);
    fireEvent.click(screen.getByRole("button", { name: /Next feature/i }));
    expect(liveText()).toBe("Feature 2 of 4: Works in Chi and Damlung");
  });

  it("wraps backwards from the first feature to the last", () => {
    render(<FeatureCoverflow />);
    fireEvent.click(screen.getByRole("button", { name: /Previous feature/i }));
    expect(liveText()).toBe("Feature 4 of 4: Up or down, at a glance");
  });

  it("jumps to a feature via its dot and marks it current", () => {
    render(<FeatureCoverflow />);
    const dot = screen.getByRole("button", {
      name: /Go to feature 3: Live spot price/i,
    });
    fireEvent.click(dot);
    expect(liveText()).toBe("Feature 3 of 4: Live spot price");
    expect(dot).toHaveAttribute("aria-current", "true");
  });

  it("moves with the arrow keys", () => {
    render(<FeatureCoverflow />);
    const carousel = screen.getByRole("group", { name: "Product features" });
    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(liveText()).toBe("Feature 3 of 4: Live spot price");
  });

  it("does not auto-advance when reduced motion is preferred", () => {
    vi.useFakeTimers();
    render(<FeatureCoverflow />);
    vi.advanceTimersByTime(20000);
    expect(liveText()).toBe("Feature 1 of 4: Your real average cost");
  });
});
