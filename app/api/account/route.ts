import { clerkClient } from "@clerk/nextjs/server";
import { apiError, apiOk } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/api/sameOrigin";
import { withAuthAndRateLimit } from "@/lib/api/withAuthAndRateLimit";

// Deletes the caller's Clerk user. The
// row cleanup is not done here — Clerk fires `user.deleted` to the
// existing webhook, which calls deleteAllTransactionsForUser. Session-
// scoped (the userId is the Clerk session's, never a request value),
// rate limited, same-origin only.
export const DELETE = withAuthAndRateLimit(async (request, { userId }) => {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch {
    return apiError(
      "ACCOUNT_DELETE_FAILED",
      "Could not delete the account — try again",
      502
    );
  }

  return apiOk({ deleted: true });
});
