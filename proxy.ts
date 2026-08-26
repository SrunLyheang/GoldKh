import { clerkMiddleware } from "@clerk/nextjs/server";
import { validateEnv } from "@/lib/env";

// Runs once per cold start, before any request is handled — fails fast
// with one readable message instead of a downstream SDK or provider
// failing confusingly deep inside a handler (see architecture.md
// invariant 10).
validateEnv();

// Auth checks live on each protected page/layout/route instead of here
// (see app/dashboard/layout.tsx and app/api/**/route.ts) — path-matcher-based
// middleware auth is deprecated because it can diverge from how Next.js
// actually routes requests. This middleware only establishes the auth
// context that those `auth()` calls read from.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
