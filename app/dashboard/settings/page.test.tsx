// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/identity/server", () => ({
  getDeviceId: vi.fn(async () => "dev_AAAAAAAAAAAAAAAAAAAAAA"),
}));
vi.mock("@/lib/db/queries/transactions", () => ({
  listTransactionsForUser: vi.fn(async () => []),
}));
// The client islands have their own tests; stub them here.
vi.mock("@/components/settings/preferences", () => ({ PreferencesSettings: () => null }));
vi.mock("@/components/settings/device", () => ({ DeviceSettings: () => null }));
vi.mock("@/components/settings/data-actions", () => ({ DataActions: () => null }));

import SettingsPage from "./page";

describe("SettingsPage", () => {
  it("links back to the landing page", async () => {
    render(await SettingsPage());
    expect(
      screen.getByRole("link", { name: "Back to home page" })
    ).toHaveAttribute("href", "/");
  });
});
