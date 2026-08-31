// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionDialog, type EditableTransaction } from "./transaction-dialog";
import type { LedgerEntryWithId } from "@/lib/calc/ledgerEntry";
import { dictionary } from "@/lib/i18n/dictionary";
import { notify } from "@/lib/ui/toast";

vi.mock("@/lib/ui/toast", () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}));
const toastError = vi.mocked(notify.error);
const toastSuccess = vi.mocked(notify.success);
const td = dictionary.en.dialog.toast;

function renderDialog(
  overrides: Partial<Parameters<typeof TransactionDialog>[0]> = {}
) {
  const onOpenChange = vi.fn();
  const props = {
    open: true,
    onOpenChange,
    currentPricePerTroyOz: "2000",
    existingTransactions: [] as LedgerEntryWithId[],
    ...overrides,
  };
  const result = render(<TransactionDialog {...props} />);
  return { ...result, onOpenChange };
}

// The price field now takes the transaction *total*; 3000 over 10 units
// derives to 300 per unit, keeping the per-unit assertions below stable.
async function fillValidBuy(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Quantity"), "10");
  await user.type(screen.getByLabelText("Total amount paid"), "3000");
}

describe("TransactionDialog", () => {
  beforeEach(() => {
    toastError.mockClear();
    toastSuccess.mockClear();
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
    await user.type(screen.getByLabelText("Total amount paid"), "300");
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Use at most 4 decimal places.")
    ).toBeInTheDocument();
    expect(toastError).toHaveBeenCalledWith(td.checkFields);
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
    // 3000 total ÷ 10 units, derived to price per unit.
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
    const sentBody = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(sentBody.pricePerUnit).toBe("300");
    expect(onAddSettled).toHaveBeenCalledWith(optimisticRow.id, { ok: true });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("derives price per unit from the total, rounding to 4 decimal places", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: "real-2" } }), { status: 200 })
      )
    );
    const onOptimisticAdd = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onOptimisticAdd, onAddSettled: vi.fn() });

    await user.type(screen.getByLabelText("Quantity"), "3");
    await user.type(screen.getByLabelText("Total amount paid"), "5585");
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    // 5585 ÷ 3 = 1861.66666… → 1861.6667
    expect(onOptimisticAdd.mock.calls[0][0].pricePerUnit).toBe("1861.6667");
  });

  it("seeds the total field from pricePerUnit × quantity in edit mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: "1" } }), { status: 200 })
      )
    );
    const transaction: EditableTransaction = {
      id: "txn-1",
      type: "buy",
      quantity: "4",
      unit: "chi",
      pricePerUnit: "312.5",
      currency: "USD",
      transactionDate: "2026-08-01",
    };
    renderDialog({ transaction, existingTransactions: [] });

    // 312.5 × 4 = 1250
    expect(screen.getByLabelText("Total amount paid")).toHaveValue(1250);
  });

  it("blocks submit and shows an inline message when the per-unit price is wildly off spot", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderDialog();

    // Spot ≈ $241/chi at currentPricePerTroyOz "2000"; $100000 for one
    // chi is ~414× spot — a hard reject.
    await user.type(screen.getByLabelText("Quantity"), "1");
    await user.type(screen.getByLabelText("Total amount paid"), "100000");
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    expect(
      await screen.findByText(/more than ten times the current spot price/i)
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a non-gating notice but still submits when the price is only mildly off spot", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: "real-3" } }), { status: 200 })
      )
    );
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    // Spot ≈ $241/chi; $1000 for one chi is ~4× spot — soft, not hard.
    await user.type(screen.getByLabelText("Quantity"), "1");
    await user.type(screen.getByLabelText("Total amount paid"), "1000");

    expect(
      await screen.findByText(/well above the current spot price/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/transactions",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("skips the sanity check for KHR rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: "1" } }), { status: 200 })
      )
    );
    const transaction: EditableTransaction = {
      id: "txn-khr",
      type: "buy",
      quantity: "1",
      unit: "chi",
      // Nonsensical against the USD spot, but valid as a KHR amount.
      pricePerUnit: "999999",
      currency: "KHR",
      transactionDate: "2026-08-01",
    };
    const user = userEvent.setup();
    renderDialog({ transaction, existingTransactions: [] });

    expect(
      screen.queryByText(/current spot price/i)
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/transactions/txn-khr",
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  it("rolls back the optimistic add and toasts a mapped message on a server rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: "INVALID_INPUT", message: "nope" } }),
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

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(td.invalidInput);
    });
    const tempId = onOptimisticAdd.mock.calls[0][0].id;
    expect(onAddSettled).toHaveBeenCalledWith(tempId, { ok: false });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("maps a 429 to the rate-limit toast", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: "RATE_LIMITED", message: "slow" } }),
          { status: 429 }
        )
      )
    );
    const user = userEvent.setup();
    renderDialog();

    await fillValidBuy(user);
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(td.rateLimited);
    });
  });

  it("toasts a network-failure message when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    renderDialog();

    await fillValidBuy(user);
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(td.network);
    });
  });

  it("toasts a success message naming the amount on a completed buy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: "real-x" } }), { status: 200 })
      )
    );
    const user = userEvent.setup();
    renderDialog({ onOptimisticAdd: vi.fn(), onAddSettled: vi.fn() });

    await fillValidBuy(user);
    await user.click(screen.getByRole("button", { name: /save transaction/i }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(td.buyAdded("10", "Chi"));
    });
  });

  it("warns when a sell quantity exceeds current holdings", async () => {
    const existingTransactions: LedgerEntryWithId[] = [
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

    await user.click(screen.getByRole("button", { name: "Sell" }));
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
