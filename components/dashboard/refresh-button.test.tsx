// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RefreshButton } from "./refresh-button";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("RefreshButton", () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the refresh route and shows a success toast on a 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { id: "snap_1", capturedAt: new Date().toISOString() },
          }),
          { status: 200 }
        )
      )
    );
    const user = userEvent.setup();
    render(<RefreshButton cooldownEndsAt={null} />);

    await user.click(screen.getByRole("button", { name: /refresh/i }));

    expect(fetch).toHaveBeenCalledWith("/api/price/refresh", {
      method: "POST",
    });
    await waitFor(() => {
      expect(screen.getByText("Refreshed")).toBeInTheDocument();
    });
  });

  it("derives the cooldown deadline from the server's capturedAt, not the click instant", async () => {
    const capturedAt = new Date(Date.now() - 60_000).toISOString();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: "snap_1", capturedAt } }), {
          status: 200,
        })
      )
    );
    const user = userEvent.setup();
    render(<RefreshButton cooldownEndsAt={null} />);

    const button = screen.getByRole("button", { name: /refresh/i });
    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
    // capturedAt was 1 minute in the past, cooldown is 5 minutes, so
    // ~4 minutes should remain — not a fresh 5-minute window starting now.
    await user.click(button);
    await waitFor(() => {
      expect(screen.getByText("Please wait 4 minutes")).toBeInTheDocument();
    });
  });

  it("shows the server's error message on a non-429 failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Provider down" } }), {
          status: 500,
        })
      )
    );
    const user = userEvent.setup();
    render(<RefreshButton cooldownEndsAt={null} />);

    await user.click(screen.getByRole("button", { name: /refresh/i }));

    await waitFor(() => {
      expect(screen.getByText("Provider down")).toBeInTheDocument();
    });
  });

  it("shows a network-failure toast when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    render(<RefreshButton cooldownEndsAt={null} />);

    await user.click(screen.getByRole("button", { name: /refresh/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Couldn't reach the server — try again shortly")
      ).toBeInTheDocument();
    });
  });

  it("shows a wait-N-minutes toast instead of fetching when already in cooldown", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const cooldownEndsAt = Date.now() + 3 * 60_000;
    render(<RefreshButton cooldownEndsAt={cooldownEndsAt} />);

    await user.click(screen.getByRole("button", { name: /refresh/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/Please wait \d+ minutes/)).toBeInTheDocument();
    });
  });

  it("enters cooldown after a 429 instead of treating it as a generic error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Too soon" } }), {
          status: 429,
        })
      )
    );
    const user = userEvent.setup();
    render(<RefreshButton cooldownEndsAt={null} />);

    const button = screen.getByRole("button", { name: /refresh/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Too soon")).toBeInTheDocument();
    });
    expect(button).toHaveAttribute("aria-disabled", "true");
  });
});
