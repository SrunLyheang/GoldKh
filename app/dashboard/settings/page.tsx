import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getDeviceId } from "@/lib/identity/server";
import { listTransactionsForUser } from "@/lib/db/queries/transactions";
import { dictionary } from "@/lib/i18n/dictionary";
import { DataActions } from "@/components/settings/data-actions";
import { DeviceSettings } from "@/components/settings/device";
import { PreferencesSettings } from "@/components/settings/preferences";

// Settings: a server-component shell with
// three client islands — Preferences (localStorage), This device (the
// recovery code for the anonymous device id), and Data (export +
// destructive actions). The device id is read here because its httpOnly
// cookie isn't visible to client JS. A link beside the title goes back to
// the landing page at "/" (the app has no other way back to it).
const t = dictionary.en;

export default async function SettingsPage() {
  const userId = await getDeviceId();
  if (!userId) return null;

  const transactions = await listTransactionsForUser(userId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="tt-heading tt-bracket text-body text-foreground">
          {t.settings.title}
        </h1>
        <Link
          href="/"
          className="tap-target tt-label inline-flex shrink-0 items-center gap-1.5 rounded-full border border-(--glass-border-to) px-3 py-1.5 text-label text-muted-foreground transition-colors hover:bg-(--glow-color) hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          {t.settings.backToHome}
        </Link>
      </div>
      <PreferencesSettings />
      <DeviceSettings recoveryCode={userId} />
      <DataActions transactions={transactions} />
    </div>
  );
}
