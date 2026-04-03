import { describe, expect, it } from "vitest";
import { isProvider } from "./index";

describe("isProvider", () => {
  it("accepts supported providers", () => {
    expect(isProvider("google")).toBe(true);
    expect(isProvider("microsoft")).toBe(true);
  });

  it("rejects unsupported providers", () => {
    expect(isProvider("ical")).toBe(false);
  });
});
