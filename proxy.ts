import { clerkMiddleware } from "@clerk/nextjs/server";

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
