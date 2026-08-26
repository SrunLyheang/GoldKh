import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Not automatic under Vitest (unlike Jest's testing-library preset) — each
// component test's rendered DOM would otherwise stack up across tests in
// the same file, breaking any query that expects exactly one match.
afterEach(() => {
  cleanup();
});
