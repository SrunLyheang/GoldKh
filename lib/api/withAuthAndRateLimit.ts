import { auth } from "@clerk/nextjs/server";
import { apiError } from "./response";
import { isRateLimited } from "./rateLimit";

type Handler<Ctx> = (
  request: Request,
  ctx: Ctx & { userId: string }
) => Promise<Response>;

// Resolves the Clerk session and hands the handler a guaranteed userId, or
// short-circuits with 401.
export function withAuth<Ctx extends object = object>(handler: Handler<Ctx>) {
  return async (request: Request, ctx?: Ctx): Promise<Response> => {
    const { userId } = await auth();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Sign in required", 401);
    }

    return handler(request, { ...ctx, userId } as Ctx & { userId: string });
  };
}

// withAuth plus a per-user rate limit — the guard for every
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
