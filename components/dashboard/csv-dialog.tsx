"use client";

import { useRef, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/dictionary";
import { notify } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";
import { formatQuantity } from "@/lib/format/money";
import {
  parseTransactionsCsv,
  type ParsedCsvRow,
} from "@/lib/csv/parseTransactionsCsv";
import {
  serializeTransactionsCsv,
  type SerializableTransaction,
} from "@/lib/csv/serializeTransactionsCsv";
import type { NewTransactionInput } from "@/lib/db/queries/transactions";
import { MAX_BULK_ROWS } from "@/lib/constants/csv";

type Mode = "export" | "import";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Exact-duplicate check against the rows already on screen — every ledger
// field must match. Non-blocking: a duplicate is still importable, it just
// gets a warning badge so an accidental re-import is visible.
function isDuplicate(
  input: NewTransactionInput,
  existing: SerializableTransaction[],
): boolean {
  return existing.some(
    (row) =>
      row.type === input.type &&
      row.unit === input.unit &&
      row.currency === input.currency &&
      row.transactionDate === input.transactionDate &&
      Number(row.quantity) === Number(input.quantity) &&
      Number(row.pricePerUnit) === Number(input.pricePerUnit) &&
      (row.notes ?? "") === (input.notes ?? ""),
  );
}

export function CsvDialog({
  open,
  onOpenChange,
  rows,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: SerializableTransaction[];
  onImported: () => void;
}) {
  const [mode, setMode] = useState<Mode>("export");
  const [parsed, setParsed] = useState<ParsedCsvRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [committing, startCommit] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const selectionGeneration = useRef(0);

  function reset() {
    selectionGeneration.current += 1;
    setParsed(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleExport() {
    const csv = serializeTransactionsCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goldkh-transactions-${todayKey()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    const generation = selectionGeneration.current + 1;
    selectionGeneration.current = generation;
    setFileName(file.name);

    const text = await file.text();
    if (generation !== selectionGeneration.current) {
      return;
    }

    const result = parseTransactionsCsv(text);
    if (result.fileError) {
      setParsed(null);
      notify.error(
        result.fileError === "empty"
          ? t.csv.emptyFile
          : result.fileError === "header"
            ? t.csv.errorToast
            : t.csv.parseError,
      );
      return;
    }

    if (generation !== selectionGeneration.current) {
      return;
    }
    setParsed(result.rows);
  }

  const validRows = parsed?.filter((r) => r.valid) ?? [];
  const overCap = validRows.length > MAX_BULK_ROWS;

  function handleCommit() {
    const payload = validRows
      .map((r) => r.input)
      .filter((i): i is NewTransactionInput => i !== undefined);
    if (payload.length === 0) return;

    startCommit(async () => {
      let res: Response;
      try {
        res = await fetch("/api/transactions/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: payload }),
        });
      } catch {
        notify.error(t.csv.errorToast);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        notify.error(
          body?.error?.code === "TOO_MANY_ROWS"
            ? t.csv.tooManyRows(MAX_BULK_ROWS)
            : t.csv.errorToast,
        );
        return;
      }
      const body = await res.json();
      notify.success(t.csv.successToast(body.data.inserted));
      reset();
      onOpenChange(false);
      onImported();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-140">
        <DialogHeader>
          <DialogTitle>{t.csv.title}</DialogTitle>
          <DialogDescription>
            {mode === "export"
              ? t.csv.exportDescription
              : t.csv.importDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {(["export", "import"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "tt-label border py-2 text-[11px] transition-colors",
                mode === m
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {m === "export" ? t.csv.export : t.csv.import}
            </button>
          ))}
        </div>

        {mode === "export" ? (
          <div className="flex flex-col gap-3 pt-2">
            <p className="text-[12px] text-muted-foreground">
              {t.csv.columnsHint}
            </p>
            <Button
              onClick={handleExport}
              disabled={rows.length === 0}
              className="w-full"
            >
              {t.csv.download}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            <p className="text-[12px] text-muted-foreground">
              {t.csv.columnsHint}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
              className="tt-label block w-full text-[11px] text-muted-foreground file:mr-3 file:border file:border-border file:bg-accent file:px-3 file:py-1.5 file:text-[11px] file:text-foreground"
            />

            {parsed && (
              <>
                <div className="max-h-64 overflow-auto rounded-lg border border-border">
                  <table className="w-full border-collapse text-[12px]">
                    <thead className="sticky top-0 bg-card">
                      <tr className="tt-label border-b border-border text-[11px] text-muted-foreground">
                        <th className="px-3 py-2 text-left font-medium">#</th>
                        <th className="py-2 pr-3 text-left font-medium">
                          {t.csv.preview}
                        </th>
                        <th className="py-2 pr-3 text-left font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.map((r) => {
                        const dup =
                          r.valid && r.input && isDuplicate(r.input, rows);
                        return (
                          <tr
                            key={r.line}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-3 py-2 font-mono text-muted-foreground">
                              {r.line}
                            </td>
                            <td className="py-2 pr-3">
                              <span
                                className={cn(
                                  "tt-label px-1.5 py-0.5 text-[9.5px]",
                                  r.valid
                                    ? "bg-state-gain/15 text-state-gain"
                                    : "bg-destructive/15 text-destructive",
                                )}
                              >
                                {r.valid ? t.csv.rowValid : t.csv.rowInvalid}
                              </span>
                              {dup && (
                                <span className="tt-label ml-1.5 bg-muted px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
                                  {t.csv.rowDuplicate}
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-muted-foreground">
                              {r.valid && r.input
                                ? `${r.input.type} ${formatQuantity(
                                    r.input.quantity,
                                  )} ${r.input.unit}`
                                : r.error}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {overCap && (
                  <p className="text-[11.5px] text-destructive">
                    {t.csv.tooManyRows(MAX_BULK_ROWS)}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11.5px] text-muted-foreground">
                    {fileName}
                  </span>
                  <Button
                    onClick={handleCommit}
                    disabled={committing || validRows.length === 0 || overCap}
                  >
                    {committing
                      ? t.csv.committing
                      : t.csv.commit(validRows.length)}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
