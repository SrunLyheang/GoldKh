// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthAuroraBackground } from "./auth-aurora-background";

describe("AuthAuroraBackground", () => {
  it("renders a decorative, non-interactive fixed layer", () => {
    const { container } = render(<AuthAuroraBackground />);
    const layer = container.firstElementChild as HTMLElement;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.className).toContain("pointer-events-none");
    expect(layer.className).toContain("fixed");
    expect(layer.querySelectorAll(".auth-aurora-blob")).toHaveLength(3);
  });
});
