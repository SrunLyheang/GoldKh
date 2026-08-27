// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutoRefresh } from "./auto-refresh";
import { MANUAL_REFRESH_COOLDOWN_MS } from "@/lib/constants/staleness";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const NOW = 60 * 60 * 1000; // 1h in — comfortably past the cooldown from t=0

function fireVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("AutoRefresh", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    vi.spyOn(Date, "now").mockReturnValue(NOW);
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshes on tab re-entry when the loaded price is older than the cooldown", () => {
    render(<AutoRefresh capturedAt={new Date(0)} />);

    fireVisibility("visible");

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("does not refresh again while still inside the cooldown", () => {
    render(<AutoRefresh capturedAt={new Date(0)} />);

    fireVisibility("visible");
    fireVisibility("visible");

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("refreshes again once the cooldown has elapsed since the last refresh", () => {
    render(<AutoRefresh capturedAt={new Date(0)} />);

    fireVisibility("visible");
    expect(refreshMock).toHaveBeenCalledTimes(1);

    vi.spyOn(Date, "now").mockReturnValue(NOW + MANUAL_REFRESH_COOLDOWN_MS + 1);
    fireVisibility("visible");

    expect(refreshMock).toHaveBeenCalledTimes(2);
  });

  it("does not refresh when the tab is going hidden", () => {
    render(<AutoRefresh capturedAt={new Date(0)} />);

    fireVisibility("hidden");

    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("stops listening after unmount", () => {
    const { unmount } = render(<AutoRefresh capturedAt={new Date(0)} />);

    unmount();
    fireVisibility("visible");

    expect(refreshMock).not.toHaveBeenCalled();
  });
});
