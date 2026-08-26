import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Deny by default: everything is private except what's listed here.
// The sign-in/sign-up pages must stay public — a signed-out user needs
// somewhere to land, otherwise auth.protect() redirects them to a page
// that then redirects them right back (infinite loop).
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
