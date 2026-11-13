"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/dashboard/panel";
import { t } from "@/lib/i18n/dictionary";
import { notify } from "@/lib/ui/toast";

// Settings → This device. There is no account: the ledger belongs to the
// anonymous device id proxy.ts set (lib/identity/device.ts). This shows
// that id as a recovery code, and lets the user switch this browser onto
// another ledger by pasting its code.
//
// `recoveryCode` comes from the server page (the httpOnly cookie is not
// readable from JS). Hidden by default — it's a bearer secret, and
// Settings may be on screen in public.
export function DeviceSettings({ recoveryCode }: { recoveryCode: string }) {
  const [revealed, setRevealed] = useState(false);
  const [code, setCode] = useState("");
  const [restoring, startRestore] = useTransition();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      notify.success(t.settings.recoveryCopied);
    } catch {
      setRevealed(true);
      notify.error(t.settings.genericError);
    }
  }

  function handleRestore(e: React.FormEvent) {
    e.preventDefault();
    startRestore(async () => {
      let res: Response;
      try {
        res = await fetch("/api/device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code.trim() }),
        });
      } catch {
        notify.error(t.settings.genericError);
        return;
      }
      if (res.status === 400) {
        notify.error(t.settings.restoreInvalid);
        return;
      }
      if (!res.ok) {
        notify.error(t.settings.genericError);
        return;
      }
      // Hard navigation: every server-rendered figure on every page now
      // belongs to a different ledger, so drop all client state at once.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/dashboard";
    });
  }

  const masked = `dev_${"•".repeat(22)}`;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="tt-heading tt-bracket text-body text-foreground">
        {t.settings.deviceTitle}
      </h2>
      <Panel size="lg" className="flex flex-col">
        <div className="flex flex-col gap-3 border-b border-(--glass-border-to) pb-4">
          <div className="max-w-[56ch]">
            <p className="text-detail font-medium text-foreground">
              {t.settings.recoveryCode}
            </p>
            <p className="mt-0.5 text-detail text-muted-foreground">
              {t.settings.recoveryCodeDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code
              data-testid="recovery-code"
              className="min-w-0 break-all rounded-md border border-(--glass-border-to) bg-accent/40 px-3 py-2 font-mono text-detail text-foreground select-all"
            >
              {revealed ? recoveryCode : masked}
            </code>
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-pressed={revealed}
              className="tt-label shrink-0 rounded-full border border-(--glass-border-to) px-3 py-1.5 text-label text-muted-foreground transition-colors hover:bg-(--glow-color) hover:text-foreground"
            >
              {revealed ? t.settings.recoveryHide : t.settings.recoveryShow}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="tt-label shrink-0 rounded-full border border-(--glass-border-to) px-3 py-1.5 text-label text-muted-foreground transition-colors hover:bg-(--glow-color) hover:text-foreground"
            >
              {t.settings.recoveryCopy}
            </button>
          </div>
        </div>

        <form onSubmit={handleRestore} className="flex flex-col gap-3 pt-4">
          <div className="max-w-[56ch]">
            <label
              htmlFor="restore-code"
              className="text-detail font-medium text-foreground"
            >
              {t.settings.restoreTitle}
            </label>
            <p className="mt-0.5 text-detail text-muted-foreground">
              {t.settings.restoreDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="restore-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.settings.restorePlaceholder}
              autoComplete="off"
              spellCheck={false}
              className="h-8 w-72 max-w-full font-mono"
            />
            <Button
              type="submit"
              size="sm"
              disabled={restoring || code.trim().length === 0}
            >
              {t.settings.restoreSubmit}
            </Button>
          </div>
        </form>
      </Panel>
    </section>
  );
}
