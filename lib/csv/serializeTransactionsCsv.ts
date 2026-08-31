import Decimal from "decimal.js";

// One transaction as the CSV export sees it — the ledger fields, minus
// anything derived at read time. `notes` may be absent or null.
export interface SerializableTransaction {
  type: "buy" | "sell";
  quantity: string;
  unit: "chi" | "damlung";
  pricePerUnit: string;
  currency: "USD" | "KHR";
  transactionDate: string;
  notes?: string | null;
}

// The column order the export writes and the import expects. `total_paid`
// mirrors the Add dialog's "Total amount paid" input (pricePerUnit x
// quantity); the ledger's per-unit price is re-derived on import.
export const CSV_COLUMNS = [
  "type",
  "quantity",
  "unit",
  "total_paid",
  "currency",
  "date",
  "notes",
] as const;

export const CSV_HEADER = CSV_COLUMNS.join(",");

// CSV formula injection guard: a notes value opening with =, +, -, or @ is
// read as a formula by Excel / Sheets / LibreOffice on import. Prefixing a
// single quote makes the spreadsheet treat the whole cell as text. Ordinary
// notes (any other first character) are returned untouched.
function neutralizeFormula(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

// RFC-4180 field escaping: wrap in double quotes and double any embedded
// quote whenever the value carries a comma, quote, CR, or LF.
function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Turns the loaded rows into a CSV string (client-side; there is no
// export endpoint). `total_paid` is rounded to 2 dp — it is money, and a
// stored pricePerUnit already absorbed the division remainder on the way
// in, so re-multiplying can leave a sub-cent tail.
export function serializeTransactionsCsv(
  rows: SerializableTransaction[]
): string {
  const lines = [CSV_HEADER];
  for (const row of rows) {
    const totalPaid = new Decimal(row.pricePerUnit)
      .times(row.quantity)
      .toDecimalPlaces(2)
      .toString();
    lines.push(
      [
        row.type,
        row.quantity,
        row.unit,
        totalPaid,
        row.currency,
        row.transactionDate,
        escapeField(neutralizeFormula(row.notes ?? "")),
      ].join(",")
    );
  }
  return lines.join("\r\n") + "\r\n";
}
