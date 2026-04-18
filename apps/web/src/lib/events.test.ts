import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SyncSnapshot, UnifiedEvent } from "@unified-calendar/domain";
import { isStale, mergeProviderEvents, getCachedSnapshot, upsertSnapshot, getOrFetchEvents } from "./events";

const makeSnapshot = (overrides: Partial<SyncSnapshot> = {}): SyncSnapshot => {
  const now = new Date();
  const past30 = new Date(now);
  past30.setDate(past30.getDate() - 30);
  const future90 = new Date(now);
  future90.setDate(future90.getDate() + 90);
  return {
    userId: "default",
    provider: "google",
    events: [],
    fetchedAt: now,
    windowStart: past30,
    windowEnd: future90,
    ...overrides,
  };
};

const makeEvent = (id: string): UnifiedEvent => ({
  id,
  sourceProvider: "google",
  sourceCalendarId: "primary",
  title: "Test Event",
  startIso: "2026-04-16T09:00:00Z",
  endIso: "2026-04-16T10:00:00Z",
  allDay: false,
});

vi.mock("./db", () => {
  const rows: unknown[] = [];
  const taggedSql = Object.assign(
    vi.fn(async () => rows),
    { rows },
  );
  return { sql: taggedSql, USER_ID: "default" };
});

vi.mock("@unified-calendar/providers-google", () => ({
  fetchGoogleEvents: vi.fn(async () => [makeEvent("google:g1")]),
}));

vi.mock("@unified-calendar/providers-microsoft", () => ({
  fetchMicrosoftEvents: vi.fn(async () => [makeEvent("microsoft:m1")]),
}));

describe("isStale", () => {
  it("returns false for a fresh snapshot with correct window", () => {
    const snapshot = makeSnapshot();
    expect(isStale(snapshot)).toBe(false);
  });

  it("returns true when fetchedAt is more than 5 minutes ago", () => {
    const old = new Date(Date.now() - 6 * 60 * 1000);
    const snapshot = makeSnapshot({ fetchedAt: old });
    expect(isStale(snapshot)).toBe(true);
  });

  it("returns true when windowStart is too recent (doesn't cover -30d)", () => {
    const tooRecent = new Date();
    tooRecent.setDate(tooRecent.getDate() - 1);
    const snapshot = makeSnapshot({ windowStart: tooRecent });
    expect(isStale(snapshot)).toBe(true);
  });

  it("returns true when windowEnd is too early (doesn't cover +90d)", () => {
    const tooSoon = new Date();
    tooSoon.setDate(tooSoon.getDate() + 1);
    const snapshot = makeSnapshot({ windowEnd: tooSoon });
    expect(isStale(snapshot)).toBe(true);
  });
});

describe("mergeProviderEvents", () => {
  it("merges events from multiple snapshots", () => {
    const gSnap = makeSnapshot({ events: [makeEvent("google:g1")] });
    const mSnap = makeSnapshot({
      provider: "microsoft",
      events: [makeEvent("microsoft:m1")],
    });
    const merged = mergeProviderEvents([gSnap, mSnap]);
    expect(merged).toHaveLength(2);
  });

  it("returns empty for no snapshots", () => {
    expect(mergeProviderEvents([])).toEqual([]);
  });
});

describe("getCachedSnapshot", () => {
  it("returns null when no rows in db", async () => {
    const { sql } = await import("./db");
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    const result = await getCachedSnapshot("default", "google");
    expect(result).toBeNull();
  });

  it("returns a SyncSnapshot when a row exists", async () => {
    const { sql } = await import("./db");
    const now = new Date();
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        user_id: "default",
        provider: "google",
        payload: [makeEvent("google:g1")],
        fetched_at: now,
        window_start: now,
        window_end: now,
      },
    ]);
    const result = await getCachedSnapshot("default", "google");
    expect(result?.provider).toBe("google");
    expect(result?.events).toHaveLength(1);
  });
});

describe("upsertSnapshot", () => {
  it("calls sql with snapshot data", async () => {
    const { sql } = await import("./db");
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    const snapshot = makeSnapshot({ events: [makeEvent("google:g1")] });
    await expect(upsertSnapshot(snapshot)).resolves.toBeUndefined();
    expect(sql).toHaveBeenCalled();
  });
});

describe("getOrFetchEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches fresh events when cache is empty", async () => {
    const { sql } = await import("./db");
    (sql as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const conn = {
      provider: "google" as const,
      userId: "u1",
      email: "u@g.com",
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: 9999999999,
    };
    const { snapshot, stale } = await getOrFetchEvents("default", "google", conn);
    expect(stale).toBe(false);
    expect(snapshot.events.length).toBeGreaterThanOrEqual(0);
  });

  it("returns stale=true and empty snapshot when fetch fails with no cache", async () => {
    const { sql } = await import("./db");
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const { fetchGoogleEvents } = await import("@unified-calendar/providers-google");
    (fetchGoogleEvents as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

    const conn = {
      provider: "google" as const,
      userId: "u1",
      email: "u@g.com",
      accessToken: "tok",
      refreshToken: "ref",
      expiresAt: 9999999999,
    };
    const { stale } = await getOrFetchEvents("default", "google", conn);
    expect(stale).toBe(true);
  });
});
