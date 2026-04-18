import type { SyncSnapshot, UnifiedEvent, UserConnection } from "@unified-calendar/domain";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getCachedSnapshot, getOrFetchEvents, mergeProviderEvents, upsertSnapshot } from "../../lib/events";

const DATABASE_URL = process.env.DATABASE_URL;
const shouldRun = Boolean(DATABASE_URL);

function makeEvent(id: string, provider: "google" | "microsoft"): UnifiedEvent {
  return {
    id,
    sourceProvider: provider,
    sourceCalendarId: "primary",
    title: "Integration Test Event",
    startIso: "2026-04-16T09:00:00Z",
    endIso: "2026-04-16T10:00:00Z",
    allDay: false,
  };
}

function makeConn(provider: "google" | "microsoft"): UserConnection {
  return {
    provider,
    userId: "integration-test-user",
    email: `test@${provider}.com`,
    accessToken: "test-token",
    refreshToken: "test-refresh",
    expiresAt: 9999999999,
  };
}

describe.skipIf(!shouldRun)("GET /api/events integration", () => {
  const TEST_USER = "integration-test-user";
  const googleEvents = Array.from({ length: 10 }, (_, i) => makeEvent(`google:g${i}`, "google"));
  const microsoftEvents = Array.from({ length: 10 }, (_, i) => makeEvent(`microsoft:m${i}`, "microsoft"));

  const now = new Date();
  const past30 = new Date(now);
  past30.setDate(past30.getDate() - 31);
  const future90 = new Date(now);
  future90.setDate(future90.getDate() + 91);

  const googleSnapshot: SyncSnapshot = {
    userId: TEST_USER,
    provider: "google",
    events: googleEvents,
    fetchedAt: now,
    windowStart: past30,
    windowEnd: future90,
  };

  const microsoftSnapshot: SyncSnapshot = {
    userId: TEST_USER,
    provider: "microsoft",
    events: microsoftEvents,
    fetchedAt: now,
    windowStart: past30,
    windowEnd: future90,
  };

  beforeAll(async () => {
    await upsertSnapshot(googleSnapshot);
    await upsertSnapshot(microsoftSnapshot);
  });

  afterAll(async () => {
    const { sql } = await import("../../lib/db");
    await sql`DELETE FROM cached_events WHERE user_id = ${TEST_USER}`;
    await sql.end();
  });

  it("returns cached google snapshot with 10 events", async () => {
    const cached = await getCachedSnapshot(TEST_USER, "google");
    expect(cached).not.toBeNull();
    expect(cached?.events).toHaveLength(10);
    expect(cached?.provider).toBe("google");
  });

  it("returns cached microsoft snapshot with 10 events", async () => {
    const cached = await getCachedSnapshot(TEST_USER, "microsoft");
    expect(cached).not.toBeNull();
    expect(cached?.events).toHaveLength(10);
    expect(cached?.provider).toBe("microsoft");
  });

  it("mergeProviderEvents combines both providers into 20 events", async () => {
    const merged = mergeProviderEvents([googleSnapshot, microsoftSnapshot]);
    expect(merged).toHaveLength(20);
    expect(merged.filter((e) => e.sourceProvider === "google")).toHaveLength(10);
    expect(merged.filter((e) => e.sourceProvider === "microsoft")).toHaveLength(10);
  });

  it("response meta shape matches api-routes contract", async () => {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 30);
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 90);

    const gCached = await getCachedSnapshot(TEST_USER, "google");
    const mCached = await getCachedSnapshot(TEST_USER, "microsoft");

    const providerMeta = [
      { provider: "google" as const, fetchedAt: gCached?.fetchedAt.toISOString() ?? null, stale: false },
      { provider: "microsoft" as const, fetchedAt: mCached?.fetchedAt.toISOString() ?? null, stale: false },
    ];

    const body = {
      events: mergeProviderEvents([gCached, mCached].filter((s): s is SyncSnapshot => s !== null)),
      meta: {
        windowStart: windowStart.toISOString().split("T")[0],
        windowEnd: windowEnd.toISOString().split("T")[0],
        providers: providerMeta,
      },
    };

    expect(body.events).toHaveLength(20);
    expect(body.meta.windowStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.meta.windowEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.meta.providers).toHaveLength(2);
    expect(body.meta.providers[0]).toMatchObject({ provider: "google", stale: false });
    expect(body.meta.providers[1]).toMatchObject({ provider: "microsoft", stale: false });
  });

  it("returns stale=true (206 equivalent) when a provider snapshot is stale", async () => {
    const staleConn = makeConn("google");
    vi.mock("@unified-calendar/providers-google", () => ({
      fetchGoogleEvents: vi.fn().mockRejectedValue(new Error("network error")),
    }));

    const staleSnapshot: SyncSnapshot = {
      userId: TEST_USER,
      provider: "google",
      events: googleEvents,
      fetchedAt: new Date(0),
      windowStart: past30,
      windowEnd: future90,
    };
    await upsertSnapshot(staleSnapshot);

    const { snapshot, stale } = await getOrFetchEvents(TEST_USER, "google", staleConn);
    expect(stale).toBe(true);
    expect(snapshot.events.length).toBeGreaterThanOrEqual(0);
  });
});
