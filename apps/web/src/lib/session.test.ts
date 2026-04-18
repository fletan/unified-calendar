import { describe, expect, it, vi, beforeEach } from "vitest";
import type { UserConnection } from "@unified-calendar/domain";
import {
  getSessionConnections,
  setSessionConnection,
  removeSessionConnection,
} from "./session";

interface MockSession {
  connections: UserConnection[];
  save: ReturnType<typeof vi.fn>;
}

let sessionStore: MockSession;

vi.mock("iron-session", () => ({
  getIronSession: vi.fn(async () => sessionStore),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({})),
}));

const baseConn: UserConnection = {
  provider: "google",
  userId: "u1",
  email: "user@gmail.com",
  accessToken: "access",
  refreshToken: "refresh",
  expiresAt: 9999999999,
};

describe("session helpers", () => {
  beforeEach(() => {
    sessionStore = { connections: [], save: vi.fn() };
  });

  describe("getSessionConnections", () => {
    it("returns empty array when no connections", async () => {
      expect(await getSessionConnections()).toEqual([]);
    });

    it("returns existing connections", async () => {
      sessionStore.connections = [baseConn];
      const result = await getSessionConnections();
      expect(result).toHaveLength(1);
      expect(result[0]?.provider).toBe("google");
    });
  });

  describe("setSessionConnection", () => {
    it("adds a new connection", async () => {
      await setSessionConnection(baseConn);
      expect(sessionStore.connections).toHaveLength(1);
      expect(sessionStore.save).toHaveBeenCalled();
    });

    it("replaces an existing connection for the same provider", async () => {
      sessionStore.connections = [baseConn];
      const updated: UserConnection = { ...baseConn, accessToken: "new-token" };
      await setSessionConnection(updated);
      expect(sessionStore.connections).toHaveLength(1);
      expect(sessionStore.connections[0]?.accessToken).toBe("new-token");
    });

    it("keeps connections for other providers", async () => {
      const msConn: UserConnection = { ...baseConn, provider: "microsoft" };
      sessionStore.connections = [baseConn];
      await setSessionConnection(msConn);
      expect(sessionStore.connections).toHaveLength(2);
    });
  });

  describe("removeSessionConnection", () => {
    it("removes a connection by provider", async () => {
      sessionStore.connections = [baseConn];
      await removeSessionConnection("google");
      expect(sessionStore.connections).toHaveLength(0);
      expect(sessionStore.save).toHaveBeenCalled();
    });

    it("only removes the matching provider", async () => {
      const msConn: UserConnection = { ...baseConn, provider: "microsoft" };
      sessionStore.connections = [baseConn, msConn];
      await removeSessionConnection("google");
      expect(sessionStore.connections).toHaveLength(1);
      expect(sessionStore.connections[0]?.provider).toBe("microsoft");
    });

    it("handles empty session gracefully", async () => {
      await expect(removeSessionConnection("google")).resolves.toBeUndefined();
    });
  });
});
