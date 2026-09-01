// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TiltCard } from "./tilt-card";

// usePointerFx() is false in jsdom, so TiltCard renders a plain <div>
// with the caller's className and no motion wrapper.
describe("TiltCard", () => {
  it("renders its child and passes className through, static under the mock", () => {
    const { container } = render(
      <TiltCard className="glass-surface p-6">
        <p>card body</p>
      </TiltCard>
    );
    expect(screen.getByText("card body")).toBeTruthy();
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("DIV");
    expect(root.className).toBe("glass-surface p-6");
  });
});
