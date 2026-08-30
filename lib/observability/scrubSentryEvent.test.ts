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

  it("drops request.query_string", () => {
    const event = {
      request: {
        method: "GET",
        url: "http://localhost/api/transactions",
        query_string: "q=Jane+Doe&token=secret",
      },
    } as unknown as Event;

    const out = scrubSentryEvent(event);

    expect(
      (out.request as Record<string, unknown>).query_string
    ).toBeUndefined();
  });

  it("strips the query string and fragment from request.url", () => {
    const event = {
      request: {
        method: "GET",
        url: "http://localhost/dashboard?token=secret&acct=12345678#section",
      },
    } as unknown as Event;

    const out = scrubSentryEvent(event);

    expect(out.request?.url).toBe("http://localhost/dashboard");
  });

  it("drops all breadcrumbs", () => {
    const event = {
      message: "boom",
      breadcrumbs: [
        {
          category: "fetch",
          data: { url: "http://localhost/api/price?token=secret" },
        },
        { category: "console", message: "user acct 12345678" },
      ],
    } as unknown as Event;

    const out = scrubSentryEvent(event);

    expect(out.breadcrumbs).toBeUndefined();
  });

  it("is a no-op when the event has no request", () => {
    const event = { message: "boom" } as Event;
    expect(scrubSentryEvent(event)).toBe(event);
  });
});
