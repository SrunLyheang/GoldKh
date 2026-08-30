# Dashboard Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard's first-time-user path smooth — no full-screen flash when adding a transaction, a self-explanatory empty state, aligned signed numbers, one success confirmation.

**Architecture:** Polish inside the existing "Vault" CSS token contract. `DashboardContent` becomes the single owner of post-mutation `router.refresh()`, each wrapped in `useTransition` so React keeps the UI painted (never mounts `app/dashboard/loading.tsx`). A 2px `--primary` inline bar replaces the lost full-screen feedback. `MonoValue` gains a `signed` mode that reserves a sign cell. The success `InlineBanner` is removed in favour of the existing Sonner toast.

**Tech Stack:** Next.js 16.3.2 (App Router, React 19), TypeScript, Tailwind v4, shadcn/ui + `@base-ui/react`, `motion`, `sonner`, Vitest + Testing Library.

**Spec:** `context/design-specs/dashboard-polish.md`

## Global Constraints

- No hardcoded hex — every colour is an existing CSS token (`ui-context.md` Colors table). New colours are not allowed.
- No new themes, no palette edits, no layout restructure. Changes must render correctly in all six themes with no per-theme CSS rule.
- Every price / quantity / cost / gain-loss figure stays on `MonoValue` (or `font-mono tabular-nums`) — `ui-context.md` Typography rule.
- Respect `prefers-reduced-motion` for any new motion (static fallback).
- English-only dictionary; new strings go in `lib/i18n/dictionary.ts`'s `en` object (`Dictionary` is derived from it).
- `next build` + `vitest run` green between tasks. Commit per task.

---

### Task 1: Route all refreshes through `useTransition`; stop the dialog refreshing; drop the success banner

**Files:**
- Modify: `components/dashboard/dashboard-content.tsx`
- Modify: `components/dashboard/transaction-dialog.tsx`
- Modify: `components/dashboard/transaction-history.tsx`
- Test: `components/dashboard/transaction-dialog.test.tsx`
- Test: `components/dashboard/transaction-history.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `DashboardContent` holds `const [isSyncing, startSync] = useTransition()` and passes `syncing={isSyncing}` to `<TransactionHistory>`.
  - `TransactionHistory` prop shape loses `successMessage: string | null`, gains `syncing?: boolean`.
  - `TransactionDialog` no longer imports `next/navigation` and no longer calls `router.refresh()`.

- [ ] **Step 1: Update the dialog test for the new post-submit contract**

In `components/dashboard/transaction-dialog.test.tsx`:
- Delete the `refreshMock` const and the `vi.mock("next/navigation", ...)` block (lines ~10-13).
- Delete `refreshMock.mockClear();` from `beforeEach`.
- Find the test that submits a valid buy and asserts `expect(refreshMock).toHaveBeenCalled();` (around line 130). Replace that assertion with:

```ts
await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
expect(toastSuccess).toHaveBeenCalled();
```

Make sure that test's `renderDialog(...)` call captures `onOpenChange` (it already returns it: `const { onOpenChange } = renderDialog({ ... })`).

- [ ] **Step 2: Run the dialog test — expect failure**

Run: `npx vitest run components/dashboard/transaction-dialog.test.tsx`
Expected: FAIL — the submit still calls `router.refresh()` on a now-undefined mock, or the assertion referencing `refreshMock` is gone but the module mock removal makes `useRouter` real and throws in jsdom.

- [ ] **Step 3: Remove `router.refresh()` from the dialog**

In `components/dashboard/transaction-dialog.tsx`:
- Delete `import { useRouter } from "next/navigation";` (line ~4).
- Delete `const router = useRouter();` (in the component body, ~line 122).
- In `handleSubmit`, delete the final `router.refresh();` line (~line 298). The lines just before it stay:

```ts
    onOpenChange(false);
  }
```

- [ ] **Step 4: Run the dialog test — expect pass**

Run: `npx vitest run components/dashboard/transaction-dialog.test.tsx`
Expected: PASS.

- [ ] **Step 5: Update the history test — success banner removed, `syncing` added**

In `components/dashboard/transaction-history.test.tsx`:
- Remove `successMessage={null}` / `successMessage="Saved"` from every `<TransactionHistory ... />` render (6 call sites).
- The test named `"renders the error and success banners when passed"` → rename to `"renders the error banner when passed"`, keep `error="Something broke"`, delete the `expect(screen.getByText("Saved")).toBeInTheDocument();` line.
- Add one new test:

```tsx
it("shows the sync bar while syncing", () => {
  render(
    <TransactionHistory
      rows={[row()]}
      currentPricePerTroyOz="2000"
      error={null}
      syncing
      onDelete={noop}
      onAddClick={noop}
      onEditSuccess={noop}
    />
  );
  expect(screen.getByRole("progressbar")).toBeInTheDocument();
});
```

- [ ] **Step 6: Run the history test — expect failure**

Run: `npx vitest run components/dashboard/transaction-history.test.tsx`
Expected: FAIL — `successMessage` still required / referenced; no `progressbar`.

- [ ] **Step 7: Update `TransactionHistory`**

In `components/dashboard/transaction-history.tsx`:
- In the props type: delete `successMessage: string | null;`, add `syncing?: boolean;`.
- In the destructure: drop `successMessage`, add `syncing = false`.
- Delete the success banner block:

```tsx
      {successMessage && (
        <InlineBanner variant="success">{successMessage}</InlineBanner>
      )}
```

- Directly under the header `<div className="mb-4 ...">…</div>`, add the sync bar:

```tsx
      {syncing && (
        <div
          role="progressbar"
          aria-label={t.transactions.syncing}
          className="mb-3 h-0.5 w-full overflow-hidden bg-border"
        >
          <div className="h-full w-1/3 bg-primary motion-safe:animate-[vault-indeterminate_1.1s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:opacity-40" />
        </div>
      )}
```

- If `InlineBanner` is now only used for the error case, leave the import — it is still used.

- [ ] **Step 8: Add the `syncing` dictionary string**

In `lib/i18n/dictionary.ts`, inside the `transactions:` object, add:

```ts
    syncing: "Syncing…",
```

- [ ] **Step 9: Add the keyframe**

In `app/globals.css`, after the `@keyframes vault-enter { … }` / `.vault-enter` block, add:

```css
/* Indeterminate progress sliver under the Transaction History header
   while a post-mutation router.refresh() reconciles in a transition.
   Compositor-only (transform). Reduced-motion callers render a static
   full-width dimmed bar instead — see TransactionHistory. */
@keyframes vault-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}
```

- [ ] **Step 10: Wire `DashboardContent`**

In `components/dashboard/dashboard-content.tsx`:
- Change the React import to include `useTransition`:

```ts
import { useEffect, useState, useTransition, type CSSProperties } from "react";
```

- Delete the `successMessage` state and its effect:

```ts
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
```
```ts
  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [successMessage]);
```

- Add the transition hook next to the other state:

```ts
  const [isSyncing, startSync] = useTransition();
```

- `handleAddSettled` becomes:

```ts
  function handleAddSettled(tempId: string, result: AddSettledResult) {
    settleAdd(tempId, result);
    if (result.ok) {
      startSync(() => router.refresh());
    } else {
      setError(result.message);
    }
  }
```

- `handleEditSuccess` becomes:

```ts
  function handleEditSuccess() {
    startSync(() => router.refresh());
  }
```

- In `handleDelete`, the final `router.refresh();` becomes:

```ts
    startSync(() => router.refresh());
```

- In the JSX, drop `successMessage={successMessage}` from `<TransactionHistory>` and add `syncing={isSyncing}`.

- [ ] **Step 11: Full check**

Run: `npx vitest run` then `npx next build`
Expected: PASS / clean. Fix any other call site the removed `successMessage` prop broke (search: `rg "successMessage"`).

- [ ] **Step 12: Manual verification**

Run the app (`npm run dev`), sign in, from a dashboard with ≥1 row add a buy.
Expected: no full-screen "Loading your dashboard…" screen; a thin gold bar flashes under the Transaction History header; exactly one toast ("Buy … added"); the new row and the stat numbers roll in without the page blanking.

- [ ] **Step 13: Commit**

```bash
git add components/dashboard/dashboard-content.tsx components/dashboard/transaction-dialog.tsx components/dashboard/transaction-history.tsx components/dashboard/transaction-dialog.test.tsx components/dashboard/transaction-history.test.tsx lib/i18n/dictionary.ts app/globals.css
git commit -m "fix: no full-screen flash on transaction mutate; single success channel"
```

---

### Task 2: `MonoValue` signed mode

**Files:**
- Modify: `components/dashboard/mono-value.tsx`
- Test: `components/dashboard/mono-value.test.tsx` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `MonoValue` accepts `signed?: boolean`. When `signed` and `children` is a string, a leading `+`/`-` (or none) renders in a fixed-width `inline-block` cell so digits align across rows. Non-string children are rendered unchanged even when `signed`.

- [ ] **Step 1: Write the failing test**

Create `components/dashboard/mono-value.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonoValue } from "./mono-value";

describe("MonoValue signed", () => {
  it("reserves a sign cell so a negative and a positive value align", () => {
    const neg = render(<MonoValue signed>{"-$285.00"}</MonoValue>);
    const pos = render(<MonoValue signed>{"$285.00"}</MonoValue>);

    const negSign = neg.container.querySelector("[data-sign-cell]");
    const posSign = pos.container.querySelector("[data-sign-cell]");

    expect(negSign).not.toBeNull();
    expect(posSign).not.toBeNull();
    expect(negSign?.textContent).toBe("-");
    expect(posSign?.textContent).toBe("");
    // digits live outside the sign cell in both
    expect(neg.container.textContent).toBe("-$285.00");
    expect(pos.container.textContent).toBe("$285.00");
  });

  it("passes non-string children through untouched when signed", () => {
    const { container } = render(
      <MonoValue signed>
        <span data-testid="child">x</span>
      </MonoValue>
    );
    expect(container.querySelector("[data-sign-cell]")).toBeNull();
    expect(container.querySelector("[data-testid=child]")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/dashboard/mono-value.test.tsx`
Expected: FAIL — `signed` prop ignored, no `[data-sign-cell]`.

- [ ] **Step 3: Implement**

Replace `components/dashboard/mono-value.tsx` with:

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "foreground" | "muted" | "gain" | "loss";

const TONE_CLASSES: Record<Tone, string> = {
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  gain: "text-state-gain",
  loss: "text-destructive",
};

// Every price, quantity, cost basis, and gain/loss figure uses this —
// mono tabular figures so columns of numbers line up. See
// context/ui-context.md's Typography section.
//
// `signed` splits a leading +/- (or nothing) into its own fixed-width
// cell so "-$285.00" and "$285.00" align on the first digit — the
// "Negative gain/loss alignment" item from ui-context.md. Only applies
// when `children` is a string; anything else renders unchanged.
export function MonoValue({
  className,
  tone = "foreground",
  signed = false,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; signed?: boolean }) {
  const base = cn("font-mono tabular-nums break-all", TONE_CLASSES[tone], className);

  if (signed && typeof children === "string") {
    const sign = children[0] === "-" || children[0] === "+" ? children[0] : "";
    const rest = sign ? children.slice(1) : children;
    return (
      <span className={base} {...props}>
        <span data-sign-cell aria-hidden className="inline-block w-[0.6em] text-right">
          {sign}
        </span>
        {rest}
      </span>
    );
  }

  return (
    <span className={base} {...props}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/dashboard/mono-value.test.tsx`
Expected: PASS.

- [ ] **Step 5: Regression check + commit**

Run: `npx vitest run components/dashboard && npx next build`
Expected: existing `MonoValue` callers (no `signed`) unaffected; build clean.

```bash
git add components/dashboard/mono-value.tsx components/dashboard/mono-value.test.tsx
git commit -m "feat: MonoValue signed mode for aligned +/- figures"
```

---

### Task 3: Apply `signed` to every tone-coloured figure

**Files:**
- Modify: `components/dashboard/animated-pnl-card.tsx`
- Modify: `components/dashboard/realized-panel.tsx`
- Modify: `components/dashboard/transaction-history.tsx`
- Test: `components/dashboard/animated-pnl-card.test.tsx`
- Test: `components/dashboard/realized-panel.test.tsx`

**Interfaces:**
- Consumes: `MonoValue`'s `signed` prop (Task 2).
- Produces: no new interfaces.

- [ ] **Step 1: Failing test — realized panel**

In `components/dashboard/realized-panel.test.tsx`, add:

```tsx
it("renders the value with a reserved sign cell", () => {
  const { container } = renderPanel({ realizedUsd: "-285", realizedPercent: "-5.1" });
  expect(container.querySelector("[data-sign-cell]")).not.toBeNull();
});
```

(Use whatever local render helper the file already defines; if it renders inline, mirror the existing pattern and pass `saleCount: 1`.)

- [ ] **Step 2: Failing test — pnl card**

In `components/dashboard/animated-pnl-card.test.tsx`, add:

```tsx
it("marks a loss with a tone left-border and a signed value", () => {
  const { container } = render(
    <AnimatedPnlCard label="Unrealized Gain/Loss" gainLossUsd="-285" gainLossPercent="-5.1" />
  );
  expect(container.querySelector(".border-l-destructive")).not.toBeNull();
  expect(container.querySelector("[data-sign-cell]")).not.toBeNull();
});
```

- [ ] **Step 3: Run both — expect failure**

Run: `npx vitest run components/dashboard/animated-pnl-card.test.tsx components/dashboard/realized-panel.test.tsx`
Expected: FAIL — no `[data-sign-cell]`, no `.border-l-destructive`.

- [ ] **Step 4: `animated-pnl-card.tsx` — signed value + tone edge**

- The value `MonoValue` gains `signed`:

```tsx
      <MonoValue tone={tone} signed className="mt-1.5 block text-[19px] font-semibold">
        {display}
      </MonoValue>
```

- The `Panel` `className` adds a left border per tone:

```tsx
    <Panel
      className={cn(
        tone === "gain" && "bg-state-gain/6 border-l-2 border-l-state-gain",
        tone === "loss" && "bg-destructive/6 border-l-2 border-l-destructive"
      )}
    >
```

- [ ] **Step 5: `realized-panel.tsx` — signed value**

The value `MonoValue` (the `text-[34px]` one) gains `signed`:

```tsx
          <MonoValue
            tone={tone}
            signed
            className="mt-1.5 block text-[34px] font-semibold tracking-tight leading-tight sm:text-[40px]"
          >
            {valueDisplay}
          </MonoValue>
```

- [ ] **Step 6: `transaction-history.tsx` — P&L column + card use `MonoValue signed`**

Desktop `Row`, the P&L `<td>` — replace the raw `formatUsd(valuation.pnlUsd)` render with a `MonoValue`:

```tsx
      <td className="py-3 pr-3 text-right font-mono text-[13px] tabular-nums">
        {valuation.pnlUsd ? (
          <MonoValue
            signed
            tone={isGain ? "gain" : "loss"}
            className="text-[13px]"
          >
            {formatUsd(valuation.pnlUsd)}
          </MonoValue>
        ) : (
          <span title={blankValueReason} className="cursor-help text-muted-foreground">—</span>
        )}
      </td>
```

(Drop the now-redundant tone classes from the `<td>` `className`; keep `text-right`.)

Mobile `TransactionCard`, the P&L block — add `signed` to the existing `MonoValue`:

```tsx
            <MonoValue tone={isGain ? "gain" : "loss"} signed className="mt-0.5 block text-[13px]">
              {formatUsd(valuation.pnlUsd)}
            </MonoValue>
```

- [ ] **Step 7: Run tests — expect pass**

Run: `npx vitest run components/dashboard`
Expected: PASS. If a `transaction-history.test.tsx` P&L assertion matched on exact `textContent` like `"-$285.00"`, it still passes — the sign cell text plus rest concatenate to the same string.

- [ ] **Step 8: Build + commit**

Run: `npx next build`

```bash
git add components/dashboard/animated-pnl-card.tsx components/dashboard/realized-panel.tsx components/dashboard/transaction-history.tsx components/dashboard/animated-pnl-card.test.tsx components/dashboard/realized-panel.test.tsx
git commit -m "feat: aligned signed P&L figures + tone edge on the P&L card"
```

---

### Task 4: Stat-row section label + hero disclaimer footnote

**Files:**
- Modify: `components/dashboard/stat-row.tsx`
- Modify: `components/dashboard/hero-price-card.tsx`
- Modify: `lib/i18n/dictionary.ts`
- Test: `components/dashboard/hero-price-card.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: new dict key `stat.sectionLabel: string`.

- [ ] **Step 1: Add the dict key**

In `lib/i18n/dictionary.ts`, inside `stat:`, add:

```ts
    sectionLabel: "Position",
```

- [ ] **Step 2: Stat-row eyebrow**

In `components/dashboard/stat-row.tsx`, wrap the returned grid so the eyebrow sits above it:

```tsx
  return (
    <div>
      <p className="tt-label tt-bracket mb-3 text-[11px] text-muted-foreground">
        {t.stat.sectionLabel}
      </p>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {/* ...unchanged StatCard / AnimatedPnlCard ... */}
      </div>
    </div>
  );
```

`t` is already in scope (`const { t } = useLocale()` near the top of `StatRow`).

- [ ] **Step 3: Hero disclaimer footnote**

In `components/dashboard/hero-price-card.tsx`, the closing disclaimer `<p>` gains a hairline top and a touch more space:

```tsx
      <p className="mt-5 border-t border-border pt-4 text-[11.5px] text-muted-foreground">
        {t.hero.disclaimer}
      </p>
```

- [ ] **Step 4: Light test**

In `components/dashboard/hero-price-card.test.tsx`, if there is an existing "renders the disclaimer" test, no change needed. Otherwise add:

```tsx
it("renders the dealer-premium disclaimer", () => {
  renderHero(); // use the file's existing helper
  expect(screen.getByText(dictionary.en.hero.disclaimer)).toBeInTheDocument();
});
```

- [ ] **Step 5: Run + build + commit**

Run: `npx vitest run components/dashboard && npx next build`

```bash
git add components/dashboard/stat-row.tsx components/dashboard/hero-price-card.tsx lib/i18n/dictionary.ts components/dashboard/hero-price-card.test.tsx
git commit -m "feat: [ POSITION ] stat eyebrow; hero disclaimer as footnote"
```

---

### Task 5: Empty state — explain the product

**Files:**
- Modify: `components/dashboard/empty-state.tsx`
- Modify: `lib/i18n/dictionary.ts`
- Test: `components/dashboard/empty-state.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: new dict block `empty.steps: string[]` (length 3). `empty.title` / `empty.description` unchanged.

- [ ] **Step 1: Failing test**

In `components/dashboard/empty-state.test.tsx`, add:

```tsx
it("lists the three how-it-works steps", () => {
  render(<EmptyState onAddClick={noop} />);
  for (const step of dictionary.en.empty.steps) {
    expect(screen.getByText(step)).toBeInTheDocument();
  }
});
```

(Import `dictionary` from `@/lib/i18n/dictionary` if not already; `noop`/render wrapper per the file's existing pattern.)

- [ ] **Step 2: Run — expect failure**

Run: `npx vitest run components/dashboard/empty-state.test.tsx`
Expected: FAIL — `empty.steps` undefined.

- [ ] **Step 3: Add the dict block**

In `lib/i18n/dictionary.ts`, replace the `empty:` block with:

```ts
  empty: {
    title: "No holdings yet",
    description:
      "Record your first buy to start tracking your gold against the live spot price.",
    steps: [
      "Add a buy — enter what you paid and how much gold.",
      "We value it against the live spot price, updated through the day.",
      "See your holdings, average cost, and unrealized gain or loss.",
    ],
  },
```

- [ ] **Step 4: Render the steps + grow the CTA**

Replace the body of `components/dashboard/empty-state.tsx`'s returned JSX:

```tsx
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
        <Coins className="h-5 w-5 text-primary" />
      </div>
      <p className="tt-heading mt-5 text-[15px] text-foreground">{t.empty.title}</p>
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
        <Button onClick={onAddClick}>
          <Plus className="h-4 w-4" />
          <span className="tt-label text-[11.5px]">{t.transactions.addTransaction}</span>
        </Button>
      </div>
    </div>
  );
```

(`size="sm"` removed from `<Button>` → default size.)

- [ ] **Step 5: Run — expect pass**

Run: `npx vitest run components/dashboard/empty-state.test.tsx`
Expected: PASS. Also re-run the file's existing tests — the title/description/CTA assertions still hold.

- [ ] **Step 6: Build + commit**

Run: `npx next build`

```bash
git add components/dashboard/empty-state.tsx lib/i18n/dictionary.ts components/dashboard/empty-state.test.tsx
git commit -m "feat: empty dashboard explains the three-step flow"
```

---

### Task 6: Documentation

**Files:**
- Modify: `context/ui-context.md`
- Modify: `context/progress-tracker.md`

**Interfaces:** none.

- [ ] **Step 1: `ui-context.md`**

- In "States Not Yet Designed", delete the **Negative gain/loss alignment** bullet (now solved by `MonoValue signed`). Keep the **Long transaction lists** bullet.
- In "Layout Patterns" → "Stat row", add a sentence: the row now carries a `[ POSITION ]` `.tt-label` eyebrow above the grid, matching the hero/realized/history section rhythm.
- In "Add transaction dialog" (or a new short "Mutation feedback" note under Layout Patterns): post-mutation reconciliation runs inside a React `useTransition` (no route-level `loading.tsx` flash); a 2px `--primary` indeterminate bar under the Transaction History header signals it. Success is a single Sonner toast — the inline success banner was removed; `InlineBanner` is error-only.
- Under "MonoValue", note the `signed` prop reserves a fixed-width sign cell.

- [ ] **Step 2: `progress-tracker.md`**

Add a dated entry "Dashboard polish (user-first pass)" summarising Parts A–D, pointing at `context/design-specs/dashboard-polish.md` and this plan. Follow the file's existing entry format.

- [ ] **Step 3: Commit**

```bash
git add context/ui-context.md context/progress-tracker.md
git commit -m "docs: dashboard polish pass — context + progress tracker"
```

---

## Self-Review

**Spec coverage:**
- Part A (flash) → Task 1 (transition wiring, dialog stops refreshing, sync bar).
- Part B1 (signed alignment) → Task 2 (primitive) + Task 3 (apply).
- Part B2 (stat eyebrow) → Task 4.
- Part B3 (P&L tone edge) → Task 3 Step 4.
- Part B4 (hero disclaimer footnote) → Task 4 Step 3.
- Part C (empty state) → Task 5.
- Part D (single success channel) → Task 1 (Steps 5-10).
- Doc updates → Task 6.

**Placeholder scan:** every code step has literal code. No TBD / "handle edge cases" / "similar to".

**Type consistency:** `startSync` / `isSyncing` (`useTransition`) named identically across `dashboard-content.tsx` steps. `syncing` prop name matches between `TransactionHistory` type, destructure, and `DashboardContent` JSX. `data-sign-cell` used identically in `mono-value.tsx` and all three consuming test assertions. `empty.steps` (array) consistent between dict block and `.map` render and test.
