import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // Nested git worktrees under .worktrees/ carry their own copy of the
    // repo (and their own node_modules) — collecting their tests here
    // pulls in a second React and fails on `useContext` of null.
    exclude: [...configDefaults.exclude, ".worktrees/**"],
    // Component tests opt into jsdom per-file via a
    // `// @vitest-environment jsdom` docblock instead of switching the
    // default here — keeps the existing node-environment lib/api tests
    // unaffected.
    setupFiles: ["./vitest.setup.ts"],
    // lib/db/client.ts calls neon(DATABASE_URL) at module load time, so
    // any test that imports it transitively (even via injected deps that
    // never actually query it) needs a syntactically valid placeholder.
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
