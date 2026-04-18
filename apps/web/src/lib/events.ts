import type { Provider, SyncSnapshot, UnifiedEvent, UserConnection } from "@unified-calendar/domain";
import { fetchGoogleEvents } from "@unified-calendar/providers-google";
import { fetchMicrosoftEvents } from "@unified-calendar/providers-microsoft";
import { sql, USER_ID } from "./db";

const STALE_MINUTES = 5;
const WINDOW_PAST_DAYS = 30;
const WINDOW_FUTURE_DAYS = 90;

function windowBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - WINDOW_PAST_DAYS);
  const end = new Date(now);
  end.setDate(end.getDate() + WINDOW_FUTURE_DAYS);
  return { start, end };
}

export function isStale(snapshot: SyncSnapshot): boolean {
  const staleThreshold = new Date(Date.now() - STALE_MINUTES * 60 * 1000);
  if (snapshot.fetchedAt < staleThreshold) return true;

  const { start, end } = windowBounds();
  const windowStartMs = start.getTime();
  const windowEndMs = end.getTime();
  if (snapshot.windowStart.getTime() > windowStartMs) return true;
  if (snapshot.windowEnd.getTime() < windowEndMs) return true;

  return false;
}

interface CachedRow {
  user_id: string;
  provider: string;
  payload: UnifiedEvent[];
  fetched_at: Date;
  window_start: Date;
  window_end: Date;
}

export async function getCachedSnapshot(
  userId: string,
  provider: Provider,
): Promise<SyncSnapshot | null> {
  const rows = await sql<CachedRow[]>`
    SELECT user_id, provider, payload, fetched_at, window_start, window_end
    FROM cached_events
    WHERE user_id = ${userId} AND provider = ${provider}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.user_id,
    provider: row.provider as Provider,
    events: row.payload,
    fetchedAt: new Date(row.fetched_at),
    windowStart: new Date(row.window_start),
    windowEnd: new Date(row.window_end),
  };
}

export async function upsertSnapshot(snapshot: SyncSnapshot): Promise<void> {
  await sql`
    INSERT INTO cached_events (user_id, provider, payload, fetched_at, window_start, window_end)
    VALUES (
      ${snapshot.userId},
      ${snapshot.provider},
      ${JSON.stringify(snapshot.events)},
      ${snapshot.fetchedAt},
      ${snapshot.windowStart},
      ${snapshot.windowEnd}
    )
    ON CONFLICT (user_id, provider) DO UPDATE SET
      payload      = EXCLUDED.payload,
      fetched_at   = EXCLUDED.fetched_at,
      window_start = EXCLUDED.window_start,
      window_end   = EXCLUDED.window_end
  `;
}

export async function getOrFetchEvents(
  userId: string,
  provider: Provider,
  connection: UserConnection,
): Promise<{ snapshot: SyncSnapshot; stale: boolean }> {
  const cached = await getCachedSnapshot(userId, provider);

  if (cached && !isStale(cached)) {
    return { snapshot: cached, stale: false };
  }

  const window = windowBounds();

  try {
    let events: UnifiedEvent[];
    if (provider === "google") {
      events = await fetchGoogleEvents(connection.accessToken, window);
    } else {
      events = await fetchMicrosoftEvents(connection.accessToken, window);
    }

    const snapshot: SyncSnapshot = {
      userId,
      provider,
      events,
      fetchedAt: new Date(),
      windowStart: window.start,
      windowEnd: window.end,
    };

    await upsertSnapshot(snapshot);
    return { snapshot, stale: false };
  } catch {
    if (cached) {
      return { snapshot: cached, stale: true };
    }
    const emptySnapshot: SyncSnapshot = {
      userId,
      provider,
      events: [],
      fetchedAt: new Date(0),
      windowStart: window.start,
      windowEnd: window.end,
    };
    return { snapshot: emptySnapshot, stale: true };
  }
}

export function mergeProviderEvents(snapshots: SyncSnapshot[]): UnifiedEvent[] {
  return snapshots.flatMap((s) => s.events);
}

export { windowBounds, USER_ID };
