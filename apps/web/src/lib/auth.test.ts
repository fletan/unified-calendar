import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateState, setStateCookie, verifyStateCookie } from "./auth";

const cookieMap = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: vi.fn((name: string, value: string) => cookieMap.set(name, value)),
    get: vi.fn((name: string) => {
      const value = cookieMap.get(name);
      return value !== undefined ? { name, value } : undefined;
    }),
    delete: vi.fn((name: string) => cookieMap.delete(name)),
  })),
}));

describe("auth helpers", () => {
  beforeEach(() => {
    cookieMap.clear();
  });

  describe("generateState", () => {
    it("returns a 64-char hex string", () => {
      const state = generateState();
      expect(state).toHaveLength(64);
      expect(state).toMatch(/^[0-9a-f]+$/);
    });

    it("returns a different value each call", () => {
      expect(generateState()).not.toBe(generateState());
    });
  });

  describe("setStateCookie / verifyStateCookie", () => {
    it("stores and verifies state successfully", async () => {
      const state = generateState();
      await setStateCookie(state);
      const ok = await verifyStateCookie(state);
      expect(ok).toBe(true);
    });

    it("deletes state cookie after successful verification", async () => {
      const state = generateState();
      await setStateCookie(state);
      await verifyStateCookie(state);
      const again = await verifyStateCookie(state);
      expect(again).toBe(false);
    });

    it("rejects a wrong state value", async () => {
      const state = generateState();
      await setStateCookie(state);
      const ok = await verifyStateCookie("wrong");
      expect(ok).toBe(false);
    });

    it("rejects when no cookie is set", async () => {
      const ok = await verifyStateCookie("anything");
      expect(ok).toBe(false);
    });
  });
});
