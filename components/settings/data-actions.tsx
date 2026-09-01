"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/dashboard/panel";
import { t } from "@/lib/i18n/dictionary";
import { notify } from "@/lib/ui/toast";
import {
  serializeTransactionsCsv,
  type SerializableTransaction,
} from "@/lib/csv/serializeTransactionsCsv";

function downloadCsv(rows: SerializableTransaction[]) {
  const csv = serializeTransactionsCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `goldkh-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// A destructive action gated behind typing DELETE. `onConfirm` runs inside
// a transition owned by the caller.
function ConfirmAction({
  label,
  prompt,
  confirmLabel,
  pending,
  onConfirm,
}: {
  label: string;
  prompt: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tt-label shrink-0 rounded-full border border-destructive px-3 py-1.5 text-[11px] text-destructive transition-colors hover:bg-destructive/10"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        aria-label={prompt}
        placeholder={prompt}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-8 w-40"
      />
      <Button
        size="sm"
        variant="destructive"
        disabled={text !== "DELETE" || pending}
        onClick={onConfirm}
      >
        {confirmLabel}
      </Button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setText("");
        }}
        className="tt-label text-[11px] text-muted-foreground hover:text-foreground"
      >
        {t.settings.cancel}
      </button>
    </div>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-(--glass-border-to) py-4 last:border-0">
      <div className="max-w-[42ch]">
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

// Settings → Data (dashboard-expansion-plan.md §6.3): export, delete all
// transactions, delete account. `transactions` is passed from the server
// page so export reuses the same serializer the CSV dialog uses.
export function DataActions({
  transactions,
}: {
  transactions: SerializableTransaction[];
}) {
  const router = useRouter();
  const [deletingAll, startDeleteAll] = useTransition();
  const [deletingAccount, startDeleteAccount] = useTransition();

  function handleDeleteAll() {
    startDeleteAll(async () => {
      let res: Response;
      try {
        res = await fetch("/api/transactions", { method: "DELETE" });
      } catch {
        notify.error(t.settings.genericError);
        return;
      }
      if (!res.ok) {
        notify.error(t.settings.genericError);
        return;
      }
      notify.success(t.settings.deleteAllToast);
      router.refresh();
    });
  }

  function handleDeleteAccount() {
    startDeleteAccount(async () => {
      let res: Response;
      try {
        res = await fetch("/api/account", { method: "DELETE" });
      } catch {
        notify.error(t.settings.genericError);
        return;
      }
      if (!res.ok) {
        notify.error(t.settings.genericError);
        return;
      }
      // Hard navigation on purpose: the Clerk session is now gone, and a
      // full reload is the cleanest way to drop every piece of client
      // state tied to the deleted account.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="tt-heading tt-bracket text-[15px] text-foreground">
        {t.settings.dataTitle}
      </h2>
      <Panel size="lg" className="flex flex-col">
        <Row
          title={t.settings.exportTransactions}
          description={t.settings.exportDescription}
        >
          <button
            type="button"
            onClick={() => downloadCsv(transactions)}
            disabled={transactions.length === 0}
            className="tt-label shrink-0 rounded-full border border-(--glass-border-to) px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-(--glow-color) hover:text-foreground disabled:opacity-50"
          >
            {t.csv.download}
          </button>
        </Row>

        <Row
          title={t.settings.deleteAll}
          description={t.settings.deleteAllDescription}
        >
          <ConfirmAction
            label={t.settings.deleteAll}
            prompt={t.settings.deleteAllPrompt}
            confirmLabel={t.settings.deleteAllConfirm}
            pending={deletingAll}
            onConfirm={handleDeleteAll}
          />
        </Row>

        <Row
          title={t.settings.deleteAccount}
          description={t.settings.deleteAccountDescription}
        >
          <ConfirmAction
            label={t.settings.deleteAccount}
            prompt={t.settings.deleteAccountPrompt}
            confirmLabel={t.settings.deleteAccountConfirm}
            pending={deletingAccount}
            onConfirm={handleDeleteAccount}
          />
        </Row>
      </Panel>
    </section>
  );
}
