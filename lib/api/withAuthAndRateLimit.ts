import { getDeviceId } from "@/lib/identity/server";
import { apiError } from "./response";
import { isRateLimited } from "./rateLimit";

type Handler<Ctx> = (
  request: Request,
  ctx: Ctx & { userId: string }
) => Promise<Response>;

// Resolves the caller's device id (the anonymous identity proxy.ts sets —
// see lib/identity/device.ts) and hands the handler a guaranteed userId,
// or short-circuits with 401 when the cookie is missing or malformed.
// `userId` is the owner key on every transaction row; it is always the
// cookie's value, never a request value.
export function withAuth<Ctx extends object = object>(handler: Handler<Ctx>) {
  return async (request: Request, ctx?: Ctx): Promise<Response> => {
    const userId = await getDeviceId();
    if (!userId) {
      return apiError(
        "UNAUTHORIZED",
        "No device id — reload the page and try again",
        401
      );
    }

    return handler(request, { ...ctx, userId } as Ctx & { userId: string });
  };
}

// withAuth plus a per-device rate limit — the guard for every
// transaction-mutating route.
export function withAuthAndRateLimit<Ctx extends object = object>(
  handler: Handler<Ctx>
) {
  return withAuth<Ctx>(async (request, ctx) => {
    if (await isRateLimited(ctx.userId)) {
      return apiError(
        "RATE_LIMITED",
        "Too many requests — please slow down and try again shortly",
        429
      );
    }

    return handler(request, ctx);
  });
}
