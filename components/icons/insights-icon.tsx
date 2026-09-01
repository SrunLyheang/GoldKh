// Custom dashboard nav icon: a square gauge housing with a single
// needle and its scale tick. 24×24, square caps + miter joins,
// stroke only.
export function InsightsIcon({ className }: { className?: string }) {
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
      <rect x="3" y="3" width="18" height="18" />
      <line x1="12" y1="12" x2="16" y2="8" />
      <line x1="15" y1="6" x2="18" y2="9" />
    </svg>
  );
}
