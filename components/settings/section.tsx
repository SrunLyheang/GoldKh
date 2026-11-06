import type { ReactNode } from "react";

// One group of settings on the settings page: its name and a sentence on
// the left, its rows on the right. Groups are separated by space, rows
// by smaller space — never by a rule under every line.
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-x-12 gap-y-4 md:grid-cols-[15rem_1fr]">
      <div>
        <h2 className="tt-heading text-figure text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 max-w-[30ch] text-detail text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </section>
  );
}

export function SettingsRow({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="max-w-[46ch]">
        <p className="text-body font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 text-detail text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
