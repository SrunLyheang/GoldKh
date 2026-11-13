import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/api/sameOrigin";
import { withAuthAndRateLimit } from "@/lib/api/withAuthAndRateLimit";
import { deleteAllTransactionsForUser } from "@/lib/db/queries/transactions";
import {
  DEVICE_COOKIE,
  deviceCookieOptions,
  isValidDeviceId,
  newDeviceId,
} from "@/lib/identity/device";

// The device-identity actions behind Settings → This device. There is no
// account: the ledger belongs to whoever holds its device id (see
// lib/identity/device.ts). Both actions are same-origin only and rate
// limited per device.

const restoreSchema = z.object({ code: z.string().trim() });

// Switch this browser onto another ledger by pasting that ledger's
// recovery code. The code is the device id itself — 128 random bits, so
// there is nothing to enumerate.
export const POST = withAuthAndRateLimit(async (request, { userId }) => {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be JSON", 400);
  }

  const parsed = restoreSchema.safeParse(body);
  if (!parsed.success || !isValidDeviceId(parsed.data.code)) {
    return apiError(
      "INVALID_RECOVERY_CODE",
      "That doesn't look like a GoldKh recovery code",
      400
    );
  }

  const code = parsed.data.code;
  const response = apiOk({ switched: code !== userId });
  response.cookies.set(DEVICE_COOKIE, code, deviceCookieOptions());
  return response;
});

// Erase this device's ledger and start fresh under a new id. The old id
// is left with no rows, so its recovery code restores nothing.
export const DELETE = withAuthAndRateLimit(async (request, { userId }) => {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  const deleted = await deleteAllTransactionsForUser(userId);

  const response = apiOk({ erased: deleted.length });
  response.cookies.set(DEVICE_COOKIE, newDeviceId(), deviceCookieOptions());
  return response;
});
