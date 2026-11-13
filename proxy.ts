import { NextResponse, type NextRequest } from "next/server";
import { validateEnv } from "@/lib/env";
import {
  DEVICE_COOKIE,
  deviceCookieOptions,
  isValidDeviceId,
  needsDeviceId,
  newDeviceId,
} from "@/lib/identity/device";

// Runs once per cold start, before any request is handled — fails fast
// with one readable message instead of a downstream SDK or provider
// failing confusingly deep inside a handler (see architecture.md
// invariant 10).
validateEnv();

// Gives every browser that reaches the app an anonymous device id — no
// sign-up (see lib/identity/device.ts). A new id is written onto the
// *request* as well as the response, so the server components rendering
// this very request already see it through cookies(). An existing id is
// re-set with a fresh max-age so an active device never expires.
export function proxy(request: NextRequest) {
  if (!needsDeviceId(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const existing = request.cookies.get(DEVICE_COOKIE)?.value;
  const deviceId = isValidDeviceId(existing) ? existing : newDeviceId();

  if (deviceId !== existing) {
    request.cookies.set(DEVICE_COOKIE, deviceId);
  }
  const response = NextResponse.next({
    request: { headers: request.headers },
  });
  response.cookies.set(DEVICE_COOKIE, deviceId, deviceCookieOptions());
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
