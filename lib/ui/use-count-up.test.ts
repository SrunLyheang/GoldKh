// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCountUp } from "./use-count-up";

// motion/react is mocked in vitest.setup.ts: useReducedMotion() returns
// true, so the hook takes the snap path and `animate` resolves to the
// target synchronously. These tests cover that settled behaviour, not the
// tween itself.
const money = (n: number) => `$${n.toFixed(2)}`;

describe("useCountUp", () => {
  it("returns the formatted target on first render", () => {
    const { result } = renderHook(() =>
      useCountUp(1234.5, { format: money })
    );
    expect(result.current).toBe("$1234.50");
  });

  it("updates to the formatted new target when it changes", () => {
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target, { format: money }),
      { initialProps: { target: 100 } }
    );
    expect(result.current).toBe("$100.00");

    rerender({ target: 250 });
    expect(result.current).toBe("$250.00");

    rerender({ target: 90 });
    expect(result.current).toBe("$90.00");
  });

  it("handles a non-finite target by formatting it directly", () => {
    const { result } = renderHook(() =>
      useCountUp(Number.NaN, { format: (n) => (Number.isNaN(n) ? "—" : money(n)) })
    );
    expect(result.current).toBe("—");
  });

  it("with `from`, settles on the target and stays put when it changes", () => {
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target, { from: 0, format: money }),
      { initialProps: { target: 500 } }
    );
    // Entrance tween 0 -> 500 (snapped by the mock).
    expect(result.current).toBe("$500.00");

    // A later change (e.g. a unit toggle) still resolves to the new value.
    rerender({ target: 42 });
    expect(result.current).toBe("$42.00");
  });
});
