import { describe, expect, it } from "vitest";
import { expectNever, isDefined } from "./index";

describe("isDefined", () => {
  it("returns true for defined values", () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined("calendar")).toBe(true);
  });

  it("returns false for nullish values", () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });

  it("throws on impossible value helper", () => {
    expect(() => expectNever("unexpected" as never)).toThrow(
      "Unexpected value",
    );
  });
});
