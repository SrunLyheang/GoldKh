import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyWebhookMock, deleteAllTransactionsForUserMock } = vi.hoisted(
  () => ({
    verifyWebhookMock: vi.fn(),
    deleteAllTransactionsForUserMock: vi.fn(),
  })
);

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: verifyWebhookMock,
}));

vi.mock("@/lib/db/queries/transactions", () => ({
  deleteAllTransactionsForUser: deleteAllTransactionsForUserMock,
}));

import { POST } from "./route";

// verifyWebhook's real signature reads NextRequest, but is mocked above —
// a plain Request is all a test call needs, cast to satisfy POST's type.
function fakeRequest(): NextRequest {
  return new Request("https://example.com/api/webhooks/clerk", {
    method: "POST",
  }) as unknown as NextRequest;
}

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when signature verification fails", async () => {
    verifyWebhookMock.mockRejectedValue(new Error("bad signature"));

    const res = await POST(fakeRequest());

    expect(res.status).toBe(400);
    expect(deleteAllTransactionsForUserMock).not.toHaveBeenCalled();
  });

  it("deletes the user's transactions on user.deleted", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_123" },
    });

    const res = await POST(fakeRequest());

    expect(res.status).toBe(200);
    expect(deleteAllTransactionsForUserMock).toHaveBeenCalledWith("user_123");
  });

  it("ignores other event types with a 200", async () => {
    verifyWebhookMock.mockResolvedValue({
      type: "user.created",
      data: { id: "user_123" },
    });

    const res = await POST(fakeRequest());

    expect(res.status).toBe(200);
    expect(deleteAllTransactionsForUserMock).not.toHaveBeenCalled();
  });
});
