// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePointerFx } from "./use-pointer-fx";

// vitest.setup.ts forces useReducedMotion() -> true and jsdom has no
// real matchMedia layout, so the gate must stay closed: every decorative
// pointer effect renders its static branch in tests.
describe("usePointerFx", () => {
  it("returns false under jsdom / reduced motion", () => {
    const { result } = renderHook(() => usePointerFx());
    expect(result.current).toBe(false);
  });
});
