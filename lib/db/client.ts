import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Constructed on first use, not at import time. Route modules are evaluated
// during `next build`'s page-data collection, where DATABASE_URL is absent;
// connecting eagerly there fails the build (neon() throws). Same rationale
// as lib/env.ts's note on not eagerly requiring secrets at import time.
let instance: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (!instance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    instance = drizzle(neon(connectionString), { schema });
  }
  return instance;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
