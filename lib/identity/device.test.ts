import { describe, expect, it } from "vitest";
import { isValidDeviceId, needsDeviceId, newDeviceId } from "./device";

describe("newDeviceId", () => {
  it("produces ids that pass validation", () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidDeviceId(newDeviceId())).toBe(true);
    }
  });

  it("does not repeat", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newDeviceId()));
    expect(ids.size).toBe(1000);
  });
});

describe("isValidDeviceId", () => {
  it.each([
    [undefined],
    [null],
    [""],
    ["user_2abc"], // an old Clerk user id is not a device id
    ["dev_short"],
    ["dev_AAAAAAAAAAAAAAAAAAAAAAA"], // 23 chars
    ["dev_AAAAAAAAAAAAAAAAAAAA+/"], // non-url-safe base64
    [" dev_AAAAAAAAAAAAAAAAAAAAAA"],
  ])("rejects %j", (value) => {
    expect(isValidDeviceId(value)).toBe(false);
  });

  it("accepts the dev_ + 22 base64url shape", () => {
    expect(isValidDeviceId("dev_AAAAAAAAAAAAAAAAAAAA-_")).toBe(true);
  });
});

describe("needsDeviceId", () => {
  it.each([
    ["/dashboard", true],
    ["/dashboard/settings", true],
    ["/api/transactions", true],
    ["/", false],
    ["/dashboards", false],
    ["/icon.svg", false],
  ])("%s → %s", (path, expected) => {
    expect(needsDeviceId(path)).toBe(expected);
  });
});
