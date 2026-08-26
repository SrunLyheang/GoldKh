import { z } from "zod";

// Validated once, at request-boundary boot (proxy.ts), not re-exported as
// a parsed singleton every module reads from — that would force
// GOLDAPI_IO_API_KEY etc. to be eagerly present at import time, breaking
// goldapi.ts's existing per-call test coverage (it deletes the env var
// mid-test to verify its own throw). This function exists to fail loudly
// and early with one aggregated message, not to replace those checks.
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, {
      message: "must be a postgres/postgresql connection string",
    }),
  CLERK_SECRET_KEY: z
    .string()
    .startsWith("sk_", { message: "must be a Clerk secret key" }),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .startsWith("pk_", { message: "must be a Clerk publishable key" }),
  // Optional, not missing-required: verifyWebhook() in
  // app/api/webhooks/clerk/route.ts already throws (caught, returned as
  // a 400) if this is unset or wrong when a webhook actually arrives.
  // Hard-requiring it here would block the entire app's boot over one
  // route's secret — validated for shape when present, not required.
  CLERK_WEBHOOK_SIGNING_SECRET: z
    .string()
    .startsWith("whsec_", {
      message: "must be a Clerk webhook signing secret",
    })
    .optional(),
  GOLDAPI_IO_API_KEY: z.string().min(1, { message: "must not be empty" }),
});

export function validateEnv(): void {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid or missing environment variables:\n${issues}`);
  }
}
