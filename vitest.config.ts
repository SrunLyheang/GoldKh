import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
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
