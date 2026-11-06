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

// Riel amounts: whole riel, grouped, with the KHR code (the ៛ sign is
// not reliably in every face). Presentation only, like the rest.
export function formatKhr(value: string): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number(value),
  )} KHR`;
}

// How people say a weight at the shop: whole damlung, then the chi left
// over ("2 damlung 5 chi", "7.5 chi"). 1 damlung = 10 chi. Takes the
// total in chi; presentation only.
export function formatDamlungChi(totalChi: string): string {
  const chi = Number(totalChi);
  if (!Number.isFinite(chi) || chi <= 0) return "0 chi";
  const damlung = Math.floor(chi / 10 + 1e-9);
  const rest = Math.round((chi - damlung * 10) * 10_000) / 10_000;
  const restLabel = rest > 0 ? `${formatQuantity(String(rest))} chi` : "";
  if (damlung === 0) return restLabel;
  return [`${damlung} damlung`, restLabel].filter(Boolean).join(" ");
}
