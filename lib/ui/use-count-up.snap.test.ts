// @vitest-environment jsdom
//
// The shared mock in vitest.setup.ts forces `useReducedMotion() => true`,
// which makes every path snap and so can't tell a tween from a snap. This
// file overrides that mock with `useReducedMotion() => false` and a spy on
// `animate`, to prove the `from`-mode snap-on-update behaviour.
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { animateMock } = vi.hoisted(() => ({
  animateMock: vi.fn(
    (
      _value: unknown,
      target: number,
      opts?: { onUpdate?: (v: number) => void }
    ) => {
      opts?.onUpdate?.(target);
      return { stop: () => {} };
    }
  ),
}));

vi.mock("motion/react", () => {
  // Stable across renders, like the real hook — a fresh object every render
  // would make the tween effect re-run on its own `setDisplay`.
  const value = { get: () => 0, set: () => {}, jump: () => {} };
  return {
    useReducedMotion: () => false,
    useMotionValue: () => value,
    animate: animateMock,
  };
});

import { useCountUp } from "./use-count-up";

const money = (n: number) => `$${n.toFixed(2)}`;

describe("useCountUp — tween vs snap", () => {
  beforeEach(() => {
    animateMock.mockClear();
  });

  // React double-invokes mount effects in this environment (the StrictMode
  // replay the hook is written around), so entrance assertions check "at
  // least once", not an exact count.

  it("with `from`: tweens the entrance, then snaps on a later target change", () => {
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target, { from: 0, format: money }),
      { initialProps: { target: 100 } }
    );

    // Entrance tweens 0 -> 100.
    expect(animateMock.mock.calls.length).toBeGreaterThan(0);
    expect(result.current).toBe("$100.00");

    animateMock.mockClear();
    rerender({ target: 250 });

    // Unit-toggle-style change: value updates but no tween runs.
    expect(animateMock).not.toHaveBeenCalled();
    expect(result.current).toBe("$250.00");
  });

  it("without `from`: later target changes still tween", () => {
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target, { format: money }),
      { initialProps: { target: 100 } }
    );

    animateMock.mockClear();
    rerender({ target: 250 });

    // The gain/loss-style caller: a recomputed value animates.
    expect(animateMock).toHaveBeenCalled();
    expect(animateMock.mock.calls.at(-1)?.[1]).toBe(250);
    expect(result.current).toBe("$250.00");
  });
});
