// Presentation-only formatting for the mono tabular-figure number
// displays required throughout DESIGN.md. Takes the numeric strings
// produced by lib/calc and lib/price — never does money math itself.
export function formatUsd(value: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

// maximumFractionDigits: 4 matches the `numeric(_, 4)` scale transactions
// are stored at, so this only trims trailing zeros (DB-padded "1.0000" ->
// "1", "1.2500" -> "1.25") — it never rounds away a digit the user entered.
export function formatQuantity(value: string): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(Number(value));
}

export function formatPercent(value: string): string {
  const n = Number(value);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
