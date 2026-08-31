// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BulkDeleteDialog } from "./bulk-delete-dialog";

describe("BulkDeleteDialog", () => {
  it("shows the pluralised count and fires onConfirm from the Delete button", async () => {
    const onConfirm = vi.fn();
    render(
      <BulkDeleteDialog
        open
        onOpenChange={vi.fn()}
        count={3}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText("Delete 3 transactions?")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Delete 3 transactions" })
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("uses the singular noun for one row", () => {
    render(
      <BulkDeleteDialog
        open
        onOpenChange={vi.fn()}
        count={1}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText("Delete 1 transaction?")).toBeInTheDocument();
  });

  it("disables both buttons and relabels Delete while pending", () => {
    render(
      <BulkDeleteDialog
        open
        onOpenChange={vi.fn()}
        count={2}
        pending
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
  });

  it("Cancel asks the parent to close", async () => {
    const onOpenChange = vi.fn();
    render(
      <BulkDeleteDialog
        open
        onOpenChange={onOpenChange}
        count={2}
        onConfirm={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
