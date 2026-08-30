// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonoValue } from "./mono-value";

describe("MonoValue signed", () => {
  it("reserves a sign cell so a negative and a positive value align", () => {
    const neg = render(<MonoValue signed>{"-$285.00"}</MonoValue>);
    const pos = render(<MonoValue signed>{"$285.00"}</MonoValue>);

    const negSign = neg.container.querySelector("[data-sign-cell]");
    const posSign = pos.container.querySelector("[data-sign-cell]");

    expect(negSign).not.toBeNull();
    expect(posSign).not.toBeNull();
    expect(negSign?.textContent).toBe("-");
    expect(posSign?.textContent).toBe("");
    // digits live outside the sign cell in both
    expect(neg.container.textContent).toBe("-$285.00");
    expect(pos.container.textContent).toBe("$285.00");
  });

  it("passes non-string children through untouched when signed", () => {
    const { container } = render(
      <MonoValue signed>
        <span data-testid="child">x</span>
      </MonoValue>
    );
    expect(container.querySelector("[data-sign-cell]")).toBeNull();
    expect(container.querySelector("[data-testid=child]")).not.toBeNull();
  });
});
