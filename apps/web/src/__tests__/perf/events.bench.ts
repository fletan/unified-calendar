import type { SyncSnapshot, UnifiedEvent } from "@unified-calendar/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mergeProviderEvents, upsertSnapshot } from "../../lib/events";

const DATABASE_URL = process.env.DATABASE_URL;
const shouldRun = Boolean(DATABASE_URL);

function makeEvent(id: string, provider: "google" | "microsoft"): UnifiedEvent {
  return {
    id,
    sourceProvider: provider,
    sourceCalendarId: "primary",
    title: `Perf Event ${id}`,
    startIso: "2026-04-16T09:00:00Z",
    endIso: "2026-04-16T10:00:00Z",
    allDay: false,
  };
}

describe.skipIf(!shouldRun)("GET /api/events performance (P95 < 5000ms)", () => {
  const TEST_USER = "perf-test-user";
  const TOTAL_EVENTS = 500;
  const ITERATIONS = 20;
  const P95_THRESHOLD_MS = 5000;

  const googleCount = Math.floor(TOTAL_EVENTS / 2);
  const microsoftCount = TOTAL_EVENTS - googleCount;

  const googleEvents = Array.from({ length: googleCount }, (_, i) => makeEvent(`google:g${i}`, "google"));
  const microsoftEvents = Array.from({ length: microsoftCount }, (_, i) => makeEvent(`microsoft:m${i}`, "microsoft"));

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

  it(`mergeProviderEvents P95 < ${P95_THRESHOLD_MS}ms over ${ITERATIONS} iterations with ${TOTAL_EVENTS} events`, async () => {
    const { getCachedSnapshot } = await import("../../lib/events");

    const durations: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      const [gCached, mCached] = await Promise.all([
        getCachedSnapshot(TEST_USER, "google"),
        getCachedSnapshot(TEST_USER, "microsoft"),
      ]);

      const snapshots: SyncSnapshot[] = [];
      if (gCached) snapshots.push(gCached);
      if (mCached) snapshots.push(mCached);

      const merged = mergeProviderEvents(snapshots);
      expect(merged).toHaveLength(TOTAL_EVENTS);

      durations.push(performance.now() - start);
    }

    durations.sort((a, b) => a - b);
    const p95Index = Math.ceil(ITERATIONS * 0.95) - 1;
    const p95 = durations[p95Index] ?? durations[durations.length - 1] ?? 0;

    expect(p95).toBeLessThan(P95_THRESHOLD_MS);
  });
});
