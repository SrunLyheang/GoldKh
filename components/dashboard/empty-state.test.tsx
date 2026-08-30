// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { dictionary } from "@/lib/i18n/dictionary";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders the empty-holdings prompt", () => {
    render(<EmptyState onAddClick={() => {}} />);
    expect(screen.getByText("No holdings yet")).toBeInTheDocument();
  });

  it("calls onAddClick when the button is clicked", async () => {
    const onAddClick = vi.fn();
    const user = userEvent.setup();
    render(<EmptyState onAddClick={onAddClick} />);

    await user.click(screen.getByRole("button", { name: /add transaction/i }));

    expect(onAddClick).toHaveBeenCalledOnce();
  });

  it("lists the three how-it-works steps", () => {
    render(<EmptyState onAddClick={() => {}} />);
    for (const step of dictionary.en.empty.steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });
});
