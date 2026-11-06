import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/dictionary";

// A blank right-hand page: what the first entry will look like, written
// faintly in pencil, and the one thing to do — write it.
export function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <section aria-labelledby="empty-title" className="flex h-full flex-col">
      <h2 id="empty-title" className="tt-heading text-figure text-foreground">
        {t.empty.title}
      </h2>
      <p className="mt-2 max-w-[44ch] text-body text-muted-foreground">
        {t.empty.description}
      </p>
      <ol className="mt-6 flex max-w-[46ch] flex-col">
        {t.empty.steps.map((step, i) => (
          <li key={i} className="flex min-h-(--line) items-baseline gap-3 py-1 text-body text-foreground">
            <span className="font-serif text-emphasis text-gold tabular-nums">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p aria-hidden="true" className="hand mt-6 -rotate-1 text-emphasis opacity-60">
        {t.empty.example}
      </p>
      <div className="mt-8">
        <Button size="lg" onClick={onAddClick} className="press min-h-12 px-6">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.transactions.addTransaction}
        </Button>
      </div>
    </section>
  );
}
