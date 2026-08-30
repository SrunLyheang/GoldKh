import { describe, expect, it } from "vitest";
import type { Event } from "@sentry/nextjs";
import { scrubSentryEvent } from "./scrubSentryEvent";

describe("scrubSentryEvent", () => {
  it("redacts the request body and drops cookies and headers", () => {
    const event = {
      request: {
        method: "POST",
        url: "http://localhost/api/transactions",
        data: { notes: "acct 12345678 — Jane Doe", quantity: "10" },
        cookies: { __session: "a-real-session-token" },
        headers: { cookie: "__session=a-real-session-token" },
      },
    } as unknown as Event;

    const out = scrubSentryEvent(event);

    expect(out.request?.data).toBe("[redacted]");
    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.headers).toBeUndefined();
    // Non-PII fields are preserved for triage.
    expect(out.request?.method).toBe("POST");
    expect(out.request?.url).toBe("http://localhost/api/transactions");
  });

  it("is a no-op when the event has no request", () => {
    const event = { message: "boom" } as Event;
    expect(scrubSentryEvent(event)).toBe(event);
  });
});
