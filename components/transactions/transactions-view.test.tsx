// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransactionsView } from "./transactions-view";
import type { TransactionRow } from "@/components/dashboard/transaction-history";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function row(overrides: Partial<TransactionRow>): TransactionRow {
  return {
    id: "r",
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

const rows = [
  row({ id: "buy-a", type: "buy", transactionDate: "2026-08-01" }),
  row({ id: "sell-b", type: "sell", transactionDate: "2026-08-05" }),
  row({ id: "buy-c", type: "buy", transactionDate: "2026-08-10" }),
];

describe("TransactionsView", () => {
  it("narrows the visible rows when a direction filter is applied", async () => {
    const user = userEvent.setup();
    render(
      <TransactionsView
        transactions={rows}
        currentPricePerTroyOz="2000"
        priceHistory={[]}
      />
    );

    // 3 rows, newest first
    expect(screen.getByText("3 transactions")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Filter/ }));
    const group = screen.getAllByRole("group", { name: "Direction" })[0];
    await user.click(within(group).getByRole("button", { name: "Sell" }));

    expect(screen.getByText("1 transaction")).toBeInTheDocument();
    expect(screen.getAllByText(/Sell 10 chi/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Buy 10 chi/)).not.toBeInTheDocument();
  });

  it("bulk-deletes every selected row with one DELETE to the bulk route", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { deleted: 3 } }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(
      <TransactionsView
        transactions={rows}
        currentPricePerTroyOz="2000"
        priceHistory={[]}
      />
    );

    await user.click(screen.getByLabelText("Select all transactions"));
    expect(screen.getByText("3 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await user.click(
      await screen.findByRole("button", { name: "Delete 3 transactions" })
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/transactions/bulk",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ ids: ["buy-c", "sell-b", "buy-a"] }),
      })
    );

    vi.unstubAllGlobals();
  });

  it("shows the empty message when filters match nothing", async () => {
    const user = userEvent.setup();
    render(
      <TransactionsView
        transactions={rows}
        currentPricePerTroyOz="2000"
        priceHistory={[]}
      />
    );

    await user.click(screen.getByRole("button", { name: /^Filter/ }));
    const [from] = screen.getAllByLabelText("From");
    await user.type(from, "2030-01-01");

    expect(
      screen.getByText("No transactions match these filters.")
    ).toBeInTheDocument();
  });
});
