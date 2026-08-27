// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RefreshButton } from "./refresh-button";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function okResponse(cooldownEndsAt: number | null = Date.now() + 5 * 60_000) {
  return new Response(
    JSON.stringify({ data: { id: "snap_1", cooldownEndsAt } }),
    { status: 200 }
  );
}

describe("RefreshButton", () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the refresh route and shows a success toast on a 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
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

  it("uses the server's cooldownEndsAt for the cooldown window, not the click instant", async () => {
    // Server says the cooldown lifts in ~4 minutes.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(okResponse(Date.now() + 4 * 60_000))
    );
    const user = userEvent.setup();
    render(<RefreshButton cooldownEndsAt={null} />);

    const button = screen.getByRole("button", { name: /refresh/i });
    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
    // ~4 minutes should remain — not a fresh 5-minute window starting now.
    await user.click(button);
    await waitFor(() => {
      expect(screen.getByText("Please wait 4 minutes")).toBeInTheDocument();
    });
  });

  it("spins immediately on click and ignores repeat clicks while the fetch is in flight", async () => {
    let resolveFetch!: (res: Response) => void;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<RefreshButton cooldownEndsAt={null} />);

    const button = screen.getByRole("button", { name: /refresh/i });
    await user.click(button);
    await user.click(button);
    await user.click(button);

    // Feedback landed on the first click, before the fetch resolved.
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("status")).toBeInTheDocument();
    // The two extra clicks did not fire more requests.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch(okResponse());
    await waitFor(() => {
      expect(screen.getByText("Refreshed")).toBeInTheDocument();
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

  it("enters cooldown from the 429 Retry-After header instead of treating it as a generic error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Too soon" } }), {
          status: 429,
          headers: { "Retry-After": "180" },
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
