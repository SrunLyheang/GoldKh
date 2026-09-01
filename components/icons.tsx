// The bespoke dashboard nav icon set. All four share one 24×24 stroke
// frame — square caps + miter joins, to match the 0-radius brutalist
// language — so the frame lives in `NavIcon` and each export is just its
// inner geometry. DashboardIcon's filled top-left square is the
// deliberate `fill="currentColor"` exception across the set (see
// context/design-specs).

function NavIcon({ className, children }: { className?: string; children: React.ReactNode }) {
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
      {children}
    </svg>
  );
}

// 2×2 grid of squares, top-left filled.
export function DashboardIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <rect x="3" y="3" width="7" height="7" fill="currentColor" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </NavIcon>
  );
}

// Two horizontal arrows crossing — a buy flowing one way, a sell the other.
export function TransactionsIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <polyline points="16 5 20 9 16 13" />
      <line x1="20" y1="15" x2="4" y2="15" />
      <polyline points="8 11 4 15 8 19" />
    </NavIcon>
  );
}

// A stepped line climbing over a baseline — deliberately blocky, not a smooth swoosh.
export function PriceIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <line x1="3" y1="20" x2="21" y2="20" />
      <polyline points="4 16 9 16 9 11 14 11 14 6 19 6" />
    </NavIcon>
  );
}

// A square gauge housing with a single needle and its scale tick.
export function InsightsIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <rect x="3" y="3" width="18" height="18" />
      <line x1="12" y1="12" x2="16" y2="8" />
      <line x1="15" y1="6" x2="18" y2="9" />
    </NavIcon>
  );
}
