import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateEnv } from "./env";

describe("validateEnv", () => {
  const original = { ...process.env };
  const valid = {
    DATABASE_URL: "postgres://user:pass@host/db",
    CLERK_SECRET_KEY: "sk_test_abc123",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_abc123",
    CLERK_WEBHOOK_SIGNING_SECRET: "whsec_abc123",
    GOLDAPI_IO_API_KEY: "goldapi-abc123",
  };

  beforeEach(() => {
    Object.assign(process.env, valid);
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("passes when every var is present and well-formed", () => {
    expect(() => validateEnv()).not.toThrow();
  });

  it("throws when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    expect(() => validateEnv()).toThrow("DATABASE_URL");
  });

  it("throws when DATABASE_URL isn't a postgres connection string", () => {
    process.env.DATABASE_URL = "mysql://user:pass@host/db";
    expect(() => validateEnv()).toThrow("DATABASE_URL");
  });

  it("throws when CLERK_SECRET_KEY doesn't start with sk_", () => {
    process.env.CLERK_SECRET_KEY = "not-a-clerk-key";
    expect(() => validateEnv()).toThrow("CLERK_SECRET_KEY");
  });

  it("throws when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY doesn't start with pk_", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "not-a-clerk-key";
    expect(() => validateEnv()).toThrow("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  });

  it("throws when CLERK_WEBHOOK_SIGNING_SECRET is set but doesn't start with whsec_", () => {
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = "not-a-secret";
    expect(() => validateEnv()).toThrow("CLERK_WEBHOOK_SIGNING_SECRET");
  });

  it("does not throw when CLERK_WEBHOOK_SIGNING_SECRET is unset — the webhook route verifies it lazily on delivery, not at boot", () => {
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    expect(() => validateEnv()).not.toThrow();
  });

  it("throws when GOLDAPI_IO_API_KEY is empty", () => {
    process.env.GOLDAPI_IO_API_KEY = "";
    expect(() => validateEnv()).toThrow("GOLDAPI_IO_API_KEY");
  });

  it("aggregates every missing/invalid var into one error", () => {
    delete process.env.DATABASE_URL;
    delete process.env.GOLDAPI_IO_API_KEY;
    try {
      validateEnv();
      expect.unreachable();
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain("DATABASE_URL");
      expect(message).toContain("GOLDAPI_IO_API_KEY");
    }
  });
});
