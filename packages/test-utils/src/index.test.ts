import { describe, expect, it } from "vitest";
import {
  expectNever,
  isDefined,
  makeCalendarSource,
  makeProviderPair,
  makeUnifiedEvent,
  makeUserConnection,
} from "./index";

describe("isDefined", () => {
  it("returns true for defined values", () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined("calendar")).toBe(true);
  });

  it("returns false for nullish values", () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });
});

describe("expectNever", () => {
  it("throws on impossible value helper", () => {
    expect(() => expectNever("unexpected" as never)).toThrow("Unexpected value");
  });
});

describe("makeUnifiedEvent", () => {
  it("returns a valid UnifiedEvent with defaults", () => {
    const event = makeUnifiedEvent();
    expect(event.id).toContain("google:");
    expect(event.sourceProvider).toBe("google");
    expect(event.allDay).toBe(false);
  });

  it("accepts overrides", () => {
    const event = makeUnifiedEvent({ title: "Custom", allDay: true });
    expect(event.title).toBe("Custom");
    expect(event.allDay).toBe(true);
  });
});

describe("makeUserConnection", () => {
  it("returns a valid UserConnection with defaults", () => {
    const conn = makeUserConnection();
    expect(conn.provider).toBe("google");
    expect(conn.accessToken).toBeTruthy();
    expect(conn.expiresAt).toBeGreaterThan(Date.now() / 1000);
  });

  it("accepts overrides", () => {
    const conn = makeUserConnection({ provider: "microsoft" });
    expect(conn.provider).toBe("microsoft");
  });
});

describe("makeCalendarSource", () => {
  it("returns a valid CalendarSource with defaults", () => {
    const src = makeCalendarSource();
    expect(src.provider).toBe("google");
    expect(src.visible).toBe(true);
  });

  it("accepts overrides", () => {
    const src = makeCalendarSource({ visible: false });
    expect(src.visible).toBe(false);
  });
});

describe("makeProviderPair", () => {
  it("returns one connection per provider", () => {
    const pair = makeProviderPair();
    expect(pair.google.provider).toBe("google");
    expect(pair.microsoft.provider).toBe("microsoft");
  });
});
