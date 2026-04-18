import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  logAuthEvent,
  logCalendarLoad,
  logProviderError,
} from "./observability";

function lastLog(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
  const call = spy.mock.calls[spy.mock.calls.length - 1];
  if (!call) throw new Error("No console.log call recorded");
  return JSON.parse(String(call[0]));
}

describe("observability", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("logAuthEvent", () => {
    it("logs success without errorType", () => {
      logAuthEvent("google", "success");
      const logged = lastLog(consoleSpy);
      expect(logged.event).toBe("auth");
      expect(logged.provider).toBe("google");
      expect(logged.outcome).toBe("success");
      expect(logged.errorType).toBeUndefined();
      expect(logged.ts).toBeTruthy();
    });

    it("logs failure with errorType", () => {
      logAuthEvent("microsoft", "failure", "state_mismatch");
      const logged = lastLog(consoleSpy);
      expect(logged.provider).toBe("microsoft");
      expect(logged.outcome).toBe("failure");
      expect(logged.errorType).toBe("state_mismatch");
    });
  });

  describe("logCalendarLoad", () => {
    it("logs duration, count, and providers", () => {
      logCalendarLoad(1234, 42, ["google", "microsoft"]);
      const logged = lastLog(consoleSpy);
      expect(logged.event).toBe("calendar_load");
      expect(logged.durationMs).toBe(1234);
      expect(logged.eventCount).toBe(42);
      expect(logged.providers).toEqual(["google", "microsoft"]);
    });
  });

  describe("logProviderError", () => {
    it("logs error without detail", () => {
      logProviderError("google", "fetch_failed");
      const logged = lastLog(consoleSpy);
      expect(logged.event).toBe("provider_error");
      expect(logged.provider).toBe("google");
      expect(logged.errorType).toBe("fetch_failed");
      expect(logged.detail).toBeUndefined();
    });

    it("logs error with detail", () => {
      logProviderError("microsoft", "refresh_failed", "Token revoked");
      const logged = lastLog(consoleSpy);
      expect(logged.detail).toBe("Token revoked");
    });
  });
});
