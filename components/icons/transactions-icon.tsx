// Custom Vault-theme nav icon: two horizontal arrows crossing —
// a buy flowing one way, a sell the other. 24×24, square caps +
// miter joins, stroke only.
export function TransactionsIcon({ className }: { className?: string }) {
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
      <line x1="4" y1="9" x2="20" y2="9" />
      <polyline points="16 5 20 9 16 13" />
      <line x1="20" y1="15" x2="4" y2="15" />
      <polyline points="8 11 4 15 8 19" />
    </svg>
  );
}
