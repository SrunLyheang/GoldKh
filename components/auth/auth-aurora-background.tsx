// Decorative animated backdrop for the auth screens: a few slow-drifting
// gold aurora blobs over the page background. CSS-only — no client
// boundary, nothing to hydrate — and fully stilled under
// prefers-reduced-motion (rules live in app/globals.css).
export function AuthAuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div className="auth-aurora-blob auth-aurora-blob-1" />
      <div className="auth-aurora-blob auth-aurora-blob-2" />
      <div className="auth-aurora-blob auth-aurora-blob-3" />
      <div className="auth-aurora-vignette" />
    </div>
  );
}
