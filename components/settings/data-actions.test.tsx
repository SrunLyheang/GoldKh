// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataActions } from "./data-actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
});

describe("DataActions destructive actions", () => {
  it("gates delete-all behind typing DELETE", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { deleted: 2 } }), { status: 200 })
    );
    render(<DataActions transactions={[]} />);

    // Two "Delete all transactions" controls exist (title + button); the
    // button opens the confirm row.
    await user.click(
      screen.getAllByRole("button", { name: "Delete all transactions" })[0]
    );

    const confirm = screen.getByRole("button", {
      name: "Delete all transactions",
    });
    expect(confirm).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(
      screen.getByLabelText("Type DELETE to confirm."),
      "DELETE"
    );
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(fetchMock).toHaveBeenCalledWith("/api/transactions", {
      method: "DELETE",
    });
  });

  it("does not call /api/account until DELETE is typed", async () => {
    const user = userEvent.setup();
    render(<DataActions transactions={[]} />);

    await user.click(screen.getByRole("button", { name: "Delete account" }));
    const confirm = screen.getByRole("button", { name: "Delete my account" });
    expect(confirm).toBeDisabled();

    await user.type(
      screen.getByLabelText("Type DELETE to confirm."),
      "delete"
    );
    expect(confirm).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
