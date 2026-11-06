import { auth } from "@clerk/nextjs/server";
import { listTransactionsForUser } from "@/lib/db/queries/transactions";
import { dictionary } from "@/lib/i18n/dictionary";
import { AccountSettings } from "@/components/settings/account";
import { DataActions } from "@/components/settings/data-actions";
import { PreferencesSettings } from "@/components/settings/preferences";

// Settings: a server-component shell with
// three client islands — Account (Clerk), Preferences (localStorage), and
// Data (export + destructive actions). Only the transaction list is read
// here, so Data's export can reuse the CSV serializer.
const t = dictionary.en;

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const transactions = await listTransactionsForUser(userId);

  return (
    <div className="dash-enter page page--plain flex flex-col gap-12 px-5 py-6 sm:px-10 sm:py-9">
      <h1 className="tt-heading text-figure-lg text-foreground">
        {t.settings.title}
      </h1>
      <PreferencesSettings />
      <AccountSettings />
      <DataActions transactions={transactions} />
    </div>
  );
}
