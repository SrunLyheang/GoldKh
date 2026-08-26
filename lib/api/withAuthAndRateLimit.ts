import { auth } from "@clerk/nextjs/server";
import { apiError } from "./response";
import { isRateLimited } from "./rateLimit";

type Handler<Ctx> = (
  request: Request,
  ctx: Ctx & { userId: string }
) => Promise<Response>;

// The one seam for "authenticated + rate-limited route handler" — the
// auth-then-rate-limit call order and its two error responses used to be
// copy-pasted at every transaction-mutating route. A wrong order or a
// missed check here is a bug in the invocation, not in isRateLimited's own
// logic, so it needed its own interface rather than three call sites that
// have to remember the same five lines correctly.
export function withAuthAndRateLimit<Ctx extends object = object>(
  handler: Handler<Ctx>
) {
  return async (request: Request, ctx?: Ctx): Promise<Response> => {
    const { userId } = await auth();
    if (!userId) {
      return apiError("UNAUTHORIZED", "Sign in required", 401);
    }

    if (await isRateLimited(userId)) {
      return apiError(
        "RATE_LIMITED",
        "Too many requests — please slow down and try again shortly",
        429
      );
    }

    return handler(request, { ...ctx, userId } as Ctx & { userId: string });
  };
}
