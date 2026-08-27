import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { deleteAllTransactionsForUser } from "@/lib/db/queries/transactions";

// Server-to-server call with no session cookie: verified by svix signature
// (verifyWebhook), not auth(). Needs CLERK_WEBHOOK_SIGNING_SECRET and an
// endpoint registered in the Clerk Dashboard subscribed to user.deleted.
//
// Only user.deleted is handled — the one event that leaves orphaned rows.
// Other events return 200 and are ignored; a 4xx would make Clerk retry.
export async function POST(request: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(request);
  } catch {
    return new Response("Webhook verification failed", { status: 400 });
  }

  if (evt.type === "user.deleted") {
    const userId = evt.data.id;
    if (userId) {
      await deleteAllTransactionsForUser(userId);
    }
  }

  return new Response("OK", { status: 200 });
}
