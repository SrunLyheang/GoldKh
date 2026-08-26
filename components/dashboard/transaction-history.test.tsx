// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransactionHistory, type TransactionRow } from "./transaction-history";

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

describe("TransactionHistory", () => {
  it("labels a buy row and shows its quantity/unit", () => {
    render(
      <TransactionHistory
        rows={[row({ type: "buy", quantity: "10", unit: "chi" })]}
        currentPricePerTroyOz="2000"
        error={null}
        successMessage={null}
        onDelete={noop}
        onAddClick={noop}
        onEditSuccess={noop}
      />
    );
    expect(screen.getAllByText(/Buy 10 chi/).length).toBeGreaterThan(0);
  });

  it("labels a sell row and blanks Current Value with a 'proceeds, not an ongoing position' reason", () => {
    render(
      <TransactionHistory
        rows={[row({ id: "row-sell", type: "sell", quantity: "3" })]}
        currentPricePerTroyOz="2000"
        error={null}
        successMessage={null}
        onDelete={noop}
        onAddClick={noop}
        onEditSuccess={noop}
      />
    );
    expect(screen.getAllByText(/Sell 3 chi/).length).toBeGreaterThan(0);
    const blanks = screen.getAllByTitle(
      "Sell rows show proceeds, not an ongoing position"
    );
    expect(blanks.length).toBeGreaterThan(0);
  });

  it("blanks Current Value and P&L for a KHR row with the KHR-specific reason", () => {
    render(
      <TransactionHistory
        rows={[row({ id: "row-khr", currency: "KHR", pricePerUnit: "1200000" })]}
        currentPricePerTroyOz="2000"
        error={null}
        successMessage={null}
        onDelete={noop}
        onAddClick={noop}
        onEditSuccess={noop}
      />
    );
    const blanks = screen.getAllByTitle("KHR entries aren't converted to USD yet");
    expect(blanks.length).toBeGreaterThan(0);
  });

  it("shows 'Saving…' instead of row actions for an optimistic (temp-id) row", () => {
    render(
      <TransactionHistory
        rows={[row({ id: "temp-abc123" })]}
        currentPricePerTroyOz="2000"
        error={null}
        successMessage={null}
        onDelete={noop}
        onAddClick={noop}
        onEditSuccess={noop}
      />
    );
    expect(screen.getAllByText("Saving…").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /actions for/i })).not.toBeInTheDocument();
  });

  it("renders the error and success banners when passed", () => {
    render(
      <TransactionHistory
        rows={[]}
        currentPricePerTroyOz="2000"
        error="Something broke"
        successMessage="Saved"
        onDelete={noop}
        onAddClick={noop}
        onEditSuccess={noop}
      />
    );
    expect(screen.getByText("Something broke")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("requires a second click (Delete after the confirm prompt) before calling onDelete", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <TransactionHistory
        rows={[row()]}
        currentPricePerTroyOz="2000"
        error={null}
        successMessage={null}
        onDelete={onDelete}
        onAddClick={noop}
        onEditSuccess={noop}
      />
    );

    const actionButtons = screen.getAllByRole("button", { name: /actions for/i });
    await user.click(actionButtons[0]);
    const menu = await screen.findAllByRole("menu");
    await user.click(within(menu[0]).getByText("Delete"));

    expect(onDelete).not.toHaveBeenCalled();

    const confirmButtons = await screen.findAllByRole("button", { name: "Delete" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "row-1" }));
  });
});
