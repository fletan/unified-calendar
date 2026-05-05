import { describe, expect, it } from "vitest";
import { UI_PACKAGE_READY, providerBadge } from "./index";

describe("ui package exports", () => {
  it("returns google badge with label and color", () => {
    const badge = providerBadge("google");
    expect(badge.label).toBe("Google");
    expect(badge.color).toBeTruthy();
  });

  it("returns microsoft badge with label and color", () => {
    const badge = providerBadge("microsoft");
    expect(badge.label).toBe("Microsoft");
    expect(badge.color).toBeTruthy();
  });

  it("exposes readiness flag", () => {
    expect(UI_PACKAGE_READY).toBe(true);
  });
});
