// Custom dashboard nav icon: a stepped line climbing over a
// baseline — deliberately blocky, not a smooth swoosh. 24×24,
// square caps + miter joins, stroke only.
export function PriceIcon({ className }: { className?: string }) {
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
      <line x1="3" y1="20" x2="21" y2="20" />
      <polyline points="4 16 9 16 9 11 14 11 14 6 19 6" />
    </svg>
  );
}
