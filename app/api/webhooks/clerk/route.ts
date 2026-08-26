import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { deleteAllTransactionsForUser } from "@/lib/db/queries/transactions";

// Clerk calls this route server-to-server (no session cookie), so unlike
// every other route in app/api it is verified by signature (svix, via
// verifyWebhook) instead of auth(). Requires CLERK_WEBHOOK_SIGNING_SECRET
// and the endpoint registered in the Clerk Dashboard under Webhooks,
// subscribed to at least user.deleted.
//
// Only user.deleted is handled: it's the one case that leaves orphaned
// data behind (see progress-tracker.md). Every other event type is
// acknowledged with 200 and ignored, per Clerk's own guidance not to 4xx
// on event types you don't act on — a 4xx makes Clerk retry the delivery.
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
