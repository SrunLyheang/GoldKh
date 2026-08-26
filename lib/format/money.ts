// Presentation-only formatting for the mono tabular-figure number
// displays required throughout ui-context.md. Takes the numeric strings
// produced by lib/calc and lib/price — never does money math itself.
export function formatUsd(value: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatQuantity(value: string): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatPercent(value: string): string {
  const n = Number(value);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
