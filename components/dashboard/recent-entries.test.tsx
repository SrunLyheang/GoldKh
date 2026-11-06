// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecentEntries } from "./recent-entries";
import type { TransactionRow } from "./transaction-history";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function row(overrides: Partial<TransactionRow> = {}): TransactionRow {
  return {
    id: "row-1",
    type: "buy",
    quantity: "10",
    unit: "chi",
    pricePerUnit: "300",
    currency: "USD",
    transactionDate: "2026-08-01",
    notes: null,
    ...overrides,
  };
}

const noop = () => {};

function renderEntries(rows: TransactionRow[], extra: Partial<Parameters<typeof RecentEntries>[0]> = {}) {
  return render(
    <RecentEntries
      rows={rows}
      currentPricePerTroyOz="2000"
      syncing={false}
      onAddClick={noop}
      onDelete={noop}
      onEditSuccess={noop}
      {...extra}
    />,
  );
}

describe("RecentEntries", () => {
  it("writes a buy the way a notebook would", () => {
    renderEntries([row({ quantity: "10", unit: "chi", pricePerUnit: "300" })]);
    const entry = screen.getByRole("listitem");
    expect(entry).toHaveTextContent(/Bought\s*10 chi\s*at\s*\$300/);
  });

  it("marks a sell as sold, with the 'proceeds, not an ongoing position' reason", () => {
    renderEntries([row({ id: "row-sell", type: "sell", quantity: "3" })]);
    expect(screen.getByRole("listitem")).toHaveTextContent(/Sold\s*3 chi/);
    expect(
      screen.getByTitle("Sell rows show proceeds, not an ongoing position"),
    ).toBeInTheDocument();
  });

  it("prints a riel row's price in riel, never with a dollar sign", () => {
    renderEntries([row({ id: "row-khr", currency: "KHR", pricePerUnit: "1200000" })]);
    const entry = screen.getByRole("listitem");
    expect(entry).toHaveTextContent("1,200,000 KHR");
    expect(entry).not.toHaveTextContent("$1,200,000");
    expect(screen.getByTitle("KHR entries aren't converted to USD yet")).toBeInTheDocument();
  });

  it("shows the user's note in their own hand", () => {
    renderEntries([row({ notes: "for the wedding" })]);
    expect(screen.getByText("for the wedding")).toHaveClass("hand");
  });

  it("shows 'Saving…' instead of row actions for an optimistic (temp-id) row", () => {
    renderEntries([row({ id: "temp-abc123" })]);
    expect(screen.getByText("Saving…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actions for/i })).not.toBeInTheDocument();
  });

  it("says so while the page reconciles after a change", () => {
    renderEntries([row()], { syncing: true });
    expect(screen.getByRole("status")).toHaveTextContent("Syncing…");
  });

  it("shows at most seven entries and links to the full ledger", () => {
    const rows = Array.from({ length: 9 }, (_, i) => row({ id: `r${i}` }));
    renderEntries(rows);
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
    expect(screen.getByRole("link", { name: /all 9 entries/i })).toHaveAttribute(
      "href",
      "/dashboard/transactions",
    );
  });

  it("calls onAddClick from 'Write an entry'", async () => {
    const onAddClick = vi.fn();
    renderEntries([row()], { onAddClick });
    await userEvent.setup().click(screen.getByRole("button", { name: /write an entry/i }));
    expect(onAddClick).toHaveBeenCalledOnce();
  });

  it("requires a second click (Delete after the confirm prompt) before calling onDelete", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderEntries([row()], { onDelete });

    await user.click(screen.getByRole("button", { name: /actions for/i }));
    const menu = await screen.findAllByRole("menu");
    await user.click(within(menu[0]).getByText("Delete"));
    expect(onDelete).not.toHaveBeenCalled();

    const confirm = await screen.findAllByRole("button", { name: "Delete" });
    await user.click(confirm[confirm.length - 1]);
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "row-1" }));
  });
});
