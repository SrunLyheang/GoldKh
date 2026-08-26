// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionDialog, type EditableTransaction } from "./transaction-dialog";
import type { TransactionWithId } from "@/lib/calc/holdings";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function renderDialog(
  overrides: Partial<Parameters<typeof TransactionDialog>[0]> = {}
) {
  const onOpenChange = vi.fn();
  const props = {
    open: true,
    onOpenChange,
    currentPricePerTroyOz: "2000",
    existingTransactions: [] as TransactionWithId[],
    ...overrides,
  };
  const result = render(<TransactionDialog {...props} />);
  return { ...result, onOpenChange };
}

async function fillValidBuy(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Quantity"), "10");
  await user.type(screen.getByLabelText("Price per unit"), "300");
}

describe("TransactionDialog", () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders 'Add transaction' when there is no transaction prop", () => {
    renderDialog();
    expect(screen.getByText("Add transaction")).toBeInTheDocument();
  });

  it("renders 'Edit transaction' when a transaction prop is passed", () => {
    const transaction: EditableTransaction = {
      id: "1",
      type: "buy",
      quantity: "10",
      unit: "chi",
      pricePerUnit: "300",
      currency: "USD",
      transactionDate: "2026-08-01",
    };
    renderDialog({ transaction, existingTransactions: [] });
    expect(screen.getByText("Edit transaction")).toBeInTheDocument();
  });

  it("shows a validation error and does not submit when quantity has too many decimal places", async () => {
    // Not an empty value: HTML5's `required` blocks form submission before
    // our JS handler runs, so an empty field can't exercise the Zod-level
    // "Invalid quantity" message. This value passes <input type="number">
    // but fails transactionInputSchema's \d{1,4}-decimal-place regex.
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Quantity"), "1.23456");
    await user.type(screen.getByLabelText("Price per unit"), "300");
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText("Invalid quantity")).toBeInTheDocument();
  });

  it("submits a valid add as a POST with the typed values, fires optimistic add, and closes on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: "real-1" } }), { status: 200 })
      )
    );
    const onOptimisticAdd = vi.fn();
    const onAddSettled = vi.fn();
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog({ onOptimisticAdd, onAddSettled });

    await fillValidBuy(user);
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    expect(onOptimisticAdd).toHaveBeenCalledOnce();
    const optimisticRow = onOptimisticAdd.mock.calls[0][0];
    expect(optimisticRow.quantity).toBe("10");
    expect(optimisticRow.pricePerUnit).toBe("300");
    expect(optimisticRow.type).toBe("buy");
    expect(optimisticRow.currency).toBe("USD");

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/transactions",
      expect.objectContaining({ method: "POST" })
    );
    expect(onAddSettled).toHaveBeenCalledWith(optimisticRow.id, { ok: true });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("rolls back the optimistic add and shows the server error on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: "bad", message: "Could not save" } }),
          { status: 400 }
        )
      )
    );
    const onOptimisticAdd = vi.fn();
    const onAddSettled = vi.fn();
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog({ onOptimisticAdd, onAddSettled });

    await fillValidBuy(user);
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    expect(await screen.findByText("Could not save")).toBeInTheDocument();
    const tempId = onOptimisticAdd.mock.calls[0][0].id;
    expect(onAddSettled).toHaveBeenCalledWith(tempId, {
      ok: false,
      message: "Could not save",
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("shows a network-failure message when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    renderDialog();

    await fillValidBuy(user);
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    expect(
      await screen.findByText("Couldn't reach the server — the transaction was not saved.")
    ).toBeInTheDocument();
  });

  it("warns when a sell quantity exceeds current holdings", async () => {
    const existingTransactions: TransactionWithId[] = [
      {
        id: "existing-1",
        type: "buy",
        quantity: "5",
        unit: "chi",
        pricePerUnit: "300",
        currency: "USD",
      },
    ];
    const user = userEvent.setup();
    renderDialog({ existingTransactions });

    await user.click(screen.getByRole("button", { name: "sell" }));
    await user.type(screen.getByLabelText("Quantity"), "10");

    expect(
      await screen.findByText(/This exceeds your current holdings of/)
    ).toBeInTheDocument();
  });

  it("PATCHes the transaction's own id in edit mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: "1" } }), { status: 200 })
      )
    );
    const transaction: EditableTransaction = {
      id: "txn-1",
      type: "buy",
      quantity: "10",
      unit: "chi",
      pricePerUnit: "300",
      currency: "USD",
      transactionDate: "2026-08-01",
    };
    const onEditSuccess = vi.fn();
    const user = userEvent.setup();
    renderDialog({ transaction, existingTransactions: [], onEditSuccess });

    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/transactions/txn-1",
        expect.objectContaining({ method: "PATCH" })
      );
    });
    expect(onEditSuccess).toHaveBeenCalledOnce();
  });
});
