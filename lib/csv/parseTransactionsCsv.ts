import Decimal from "decimal.js";
import type { NewTransactionInput } from "@/lib/db/queries/transactions";
import { transactionInputSchema } from "@/lib/validation/transaction";

// One data row of an imported CSV, after tokenizing + schema validation.
// `input` is present iff `valid`; `error` carries the first problem
// otherwise. `line` is the 1-based source line, for the preview table.
export interface ParsedCsvRow {
  line: number;
  valid: boolean;
  input?: NewTransactionInput;
  error?: string;
}

export interface ParseCsvResult {
  rows: ParsedCsvRow[];
  // Whole-file problems that stop the import before any row is shown.
  fileError?: "empty" | "header" | "parse";
}

const REQUIRED_COLUMNS = [
  "type",
  "quantity",
  "unit",
  "total_paid",
  "currency",
  "date",
] as const;

// RFC-4180-ish tokenizer: quoted fields, doubled quotes, embedded commas
// and newlines, `\r\n` or `\n` row terminators. Returns one string[] per
// physical record; a record that spans lines (quoted newline) counts as
// one. `null` on a structural failure the caller maps to `fileError`.
function tokenize(text: string): string[][] | null {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    record.push(field);
    field = "";
  };
  const pushRecord = () => {
    pushField();
    records.push(record);
    record = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      // Swallow a following \n so \r\n is one break.
      if (text[i + 1] === "\n") i += 1;
      pushRecord();
      i += 1;
      continue;
    }
    if (ch === "\n") {
      pushRecord();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  if (inQuotes) return null; // unterminated quoted field
  // Trailing content with no final newline is still a record.
  if (field !== "" || record.length > 0) pushRecord();

  return records;
}

function derivePricePerUnit(totalPaid: string, quantity: string): string {
  const total = totalPaid.trim();
  const qty = quantity.trim();
  if (!/^\d*\.?\d+$/.test(total) || !/^\d*\.?\d+$/.test(qty)) return "";
  if (Number(qty) <= 0) return "";
  return new Decimal(total).div(qty).toDecimalPlaces(4).toString();
}

export function parseTransactionsCsv(text: string): ParseCsvResult {
  if (text.trim() === "") return { rows: [], fileError: "empty" };

  const records = tokenize(text);
  if (records === null) return { rows: [], fileError: "parse" };
  if (records.length === 0) return { rows: [], fileError: "empty" };

  const [headerRecord, ...dataRecords] = records;
  const header = headerRecord.map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) return { rows: [], fileError: "header" };

  const columnCount = header.length;
  const at = (fields: string[], name: string) => {
    const idx = header.indexOf(name);
    return idx === -1 ? "" : (fields[idx] ?? "").trim();
  };

  const rows: ParsedCsvRow[] = [];
  // Physical source line: 1 for the header, then +1 per record. A record
  // that consumed an embedded newline still advances by one here — the
  // number is a best-effort pointer for the preview, not an exact offset.
  let line = 1;
  for (const fields of dataRecords) {
    line += 1;

    // A single empty field is a blank line — skip it, but keep counting.
    if (fields.length === 1 && fields[0].trim() === "") continue;

    if (fields.length !== columnCount) {
      rows.push({
        line,
        valid: false,
        error: `Expected ${columnCount} columns, found ${fields.length}.`,
      });
      continue;
    }

    const notesRaw = at(fields, "notes");
    const candidate = {
      type: at(fields, "type"),
      quantity: at(fields, "quantity"),
      unit: at(fields, "unit"),
      pricePerUnit: derivePricePerUnit(
        at(fields, "total_paid"),
        at(fields, "quantity")
      ),
      currency: at(fields, "currency"),
      transactionDate: at(fields, "date"),
      notes: notesRaw === "" ? undefined : notesRaw,
    };

    const parsed = transactionInputSchema.safeParse(candidate);
    if (parsed.success) {
      rows.push({ line, valid: true, input: parsed.data });
    } else {
      rows.push({
        line,
        valid: false,
        error: parsed.error.issues[0]?.message ?? "Invalid row.",
      });
    }
  }

  return { rows };
}
