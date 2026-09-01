// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnimatedHeroImage } from "./animated-hero-image";

// The hero drops its heaviest decorative layers on small / touch screens
// (the `(max-width: 767px), (pointer: coarse)` query) so scrolling
// through and past it stays smooth on phones. jsdom has no matchMedia,
// so each test installs one that answers a fixed set of queries.
function stubMatchMedia(matches: (query: string) => boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: matches(query),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AnimatedHeroImage", () => {
  it("renders the full effect stack on a capable pointer-fine viewport", () => {
    stubMatchMedia(() => false); // nothing matches: desktop, no reduced motion
    const { container } = render(<AnimatedHeroImage />);

    expect(container.querySelector("video")).toBeInTheDocument();
    // Particle canvas and the float animation are present.
    expect(container.querySelector("canvas")).toBeInTheDocument();
    expect(container.querySelector(".anim-float-gentle")).toBeInTheDocument();
    // At least one mix-blend beam wash.
    expect(container.querySelector(".mix-blend-screen")).toBeInTheDocument();
  });

  it("drops the particle canvas and blend layers on a small / touch screen", () => {
    stubMatchMedia((q) => q.includes("max-width") || q.includes("coarse"));
    const { container } = render(<AnimatedHeroImage />);

    // Core visual and text-contrast vignettes stay.
    expect(container.querySelector("video")).toBeInTheDocument();
    expect(
      container.querySelector(".bg-gradient-to-t"),
    ).toBeInTheDocument();

    // Heavy layers are gone.
    expect(container.querySelector("canvas")).not.toBeInTheDocument();
    expect(
      container.querySelector(".anim-float-gentle"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".mix-blend-screen"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".mix-blend-color-dodge"),
    ).not.toBeInTheDocument();
  });

  it("also drops the heavy layers under prefers-reduced-motion alone", () => {
    stubMatchMedia((q) => q.includes("prefers-reduced-motion"));
    const { container } = render(<AnimatedHeroImage />);

    expect(container.querySelector("canvas")).not.toBeInTheDocument();
    expect(
      container.querySelector(".mix-blend-screen"),
    ).not.toBeInTheDocument();
  });
});
