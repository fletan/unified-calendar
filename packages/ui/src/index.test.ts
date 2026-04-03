import { describe, expect, it } from "vitest";
import { UI_PACKAGE_READY, providerBadge } from "./index";

describe("ui package exports", () => {
  it("returns provider labels", () => {
    expect(providerBadge("google")).toBe("Google");
    expect(providerBadge("microsoft")).toBe("Microsoft");
  });

  it("exposes readiness flag", () => {
    expect(UI_PACKAGE_READY).toBe(true);
  });
});
