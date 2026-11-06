// While a page loads, the notebook is already open: the same pages in
// the same places, with faint pencil bars where the figures will go.
// Nothing jumps when the real page arrives.
function Bar({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block rounded-sm bg-foreground/8 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Opening your notebook…" className="flex flex-col gap-6 md:gap-8">
      <div className="grid overflow-hidden rounded-xl shadow-(--shadow-page) md:grid-cols-[1.08fr_1fr]">
        <div className="page rounded-none px-5 pb-10 pt-6 sm:px-10 md:pl-14 md:pt-8">
          <Bar className="h-3 w-40" />
          <Bar className="mt-8 h-6 w-32" />
          <Bar className="mt-4 h-14 w-72 max-w-full" />
          <Bar className="mt-3 h-3 w-48" />
          <Bar className="mt-12 h-6 w-36" />
          <Bar className="mt-4 h-9 w-60 max-w-full" />
          <div className="mt-6 flex flex-col gap-4">
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-full" />
          </div>
        </div>
        <div className="page rounded-none px-5 pb-10 pt-6 sm:px-10 md:pt-8">
          <Bar className="h-6 w-44" />
          <div className="mt-10 flex flex-col gap-6">
            {Array.from({ length: 5 }, (_, i) => (
              <Bar key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="page page--plain h-72 px-5 py-6 sm:px-10">
        <Bar className="h-6 w-40" />
      </div>
      <span className="sr-only">Opening your notebook…</span>
    </div>
  );
}
