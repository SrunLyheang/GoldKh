// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GoldCursor } from "./gold-cursor";

// vitest.setup.ts mocks motion/react's useReducedMotion() -> true, so
// GoldCursor takes its disabled branch and renders nothing at all,
// leaving the native cursor and the DOM untouched.

describe("GoldCursor", () => {
  it("renders nothing under reduced motion", () => {
    const { container } = render(<GoldCursor />);
    expect(container).toBeEmptyDOMElement();
  });
});
