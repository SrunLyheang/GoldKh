import { Coins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic";
import { t } from "@/lib/i18n/dictionary";

// Trigger-only — the actual dialog is a single shared instance owned by
// DashboardContent (see transaction-dialog.tsx's header comment for why:
// a dialog rendered here would get unmounted mid-request the instant the
// first optimistic add flips DashboardContent from this screen to the
// real table).
export function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="glass-surface flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--glow-color)">
        <Coins className="h-5 w-5 text-primary" />
      </div>
      <p className="tt-heading tt-eyebrow mt-5 text-[15px] text-foreground">{t.empty.title}</p>
      <p className="mt-1.5 max-w-xs text-[13.5px] text-muted-foreground">
        {t.empty.description}
      </p>
      <ol className="mt-6 flex max-w-sm flex-col gap-2.5 text-left">
        {t.empty.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-[12.5px] text-muted-foreground">
            <span className="tt-label shrink-0 text-primary">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-7">
        <Magnetic strength={10}>
          <Button onClick={onAddClick}>
            <Plus className="h-4 w-4" />
            <span className="tt-label text-[11.5px]">{t.transactions.addTransaction}</span>
          </Button>
        </Magnetic>
      </div>
    </div>
  );
}
