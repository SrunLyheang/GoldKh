// Custom Vault-theme nav icon: 2×2 grid of squares, top-left filled.
// 24×24, square caps + miter joins to match the 0-radius brutalist
// language. The filled square is the deliberate `fill="currentColor"`
// exception across the custom set (see context/design-specs).
export function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" fill="currentColor" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
