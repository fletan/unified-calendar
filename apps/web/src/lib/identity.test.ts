import { describe, expect, it } from "vitest";
import { identity } from "./identity";

describe("identity", () => {
  it("returns the exact same value", () => {
    const payload = { id: "evt_1", title: "Meeting" };
    expect(identity(payload)).toBe(payload);
  });
});
