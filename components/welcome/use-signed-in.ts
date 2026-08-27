"use client";

import { useAuth } from "@clerk/nextjs";

// Clerk Core 3 removed the <SignedIn>/<SignedOut> control components, so
// the landing page (a static client tree — see welcome-landing.tsx)
// reads auth state through the hook instead. Returns false until Clerk
// has loaded, so the signed-out CTAs render first and the page can
// still be statically prerendered.
export function useSignedIn(): boolean {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded && Boolean(isSignedIn);
}
