import { sealData } from "iron-session";
import type { Page } from "@playwright/test";
import postgres from "postgres";
import path from "node:path";

// Load .env.local so DATABASE_URL and SESSION_PASSWORD are available in Playwright worker processes
process.loadEnvFile(path.resolve(__dirname, "../.env.local"));

export const TEST_USER = "default";

export interface SeedEvent {
  id: string;
  title: string;
  provider: "google" | "microsoft";
  startIso: string;
  endIso: string;
}

function makeUnifiedEvent(e: SeedEvent) {
  return {
    id: e.id,
    sourceProvider: e.provider,
    sourceCalendarId: "primary",
    title: e.title,
    startIso: e.startIso,
    endIso: e.endIso,
    allDay: false,
  };
}

/**
 * Seeds `cached_events` in Postgres for the given provider and returns a
 * cleanup function that removes the seeded row.
 */
export async function seedProviderEvents(
  events: SeedEvent[],
  provider: "google" | "microsoft",
): Promise<() => Promise<void>> {
  const sql = postgres(process.env.DATABASE_URL ?? "", { onnotice: () => {} });
  const now = new Date();
  // Use a 1-day buffer beyond isStale thresholds to account for DATE truncation
  // (window_start/end stored as DATE = midnight UTC; isStale compares exact timestamps)
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 32);
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + 92);

  // Ensure schema exists — the app normally bootstraps this on module load.
  // Use DO $$ ... END to make it idempotent under concurrent workers.
  await sql`
    DO $$ BEGIN
      CREATE TABLE IF NOT EXISTS cached_events (
        id           BIGSERIAL PRIMARY KEY,
        user_id      TEXT        NOT NULL,
        provider     TEXT        NOT NULL CHECK (provider IN ('google', 'microsoft')),
        payload      JSONB       NOT NULL,
        fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        window_start DATE        NOT NULL,
        window_end   DATE        NOT NULL,
        UNIQUE (user_id, provider)
      );
    EXCEPTION WHEN duplicate_table THEN NULL;
    END $$
  `;

  const payload = events.map(makeUnifiedEvent);

  await sql`
    INSERT INTO cached_events (user_id, provider, payload, fetched_at, window_start, window_end)
    VALUES (
      ${TEST_USER},
      ${provider},
      ${sql.json(payload as never)},
      ${now},
      ${windowStart},
      ${windowEnd}
    )
    ON CONFLICT (user_id, provider) DO UPDATE SET
      payload      = EXCLUDED.payload,
      fetched_at   = EXCLUDED.fetched_at,
      window_start = EXCLUDED.window_start,
      window_end   = EXCLUDED.window_end
  `;

  return async () => {
    await sql`DELETE FROM cached_events WHERE user_id = ${TEST_USER} AND provider = ${provider}`;
    await sql.end();
  };
}

/**
 * Injects a pre-authenticated iron-session cookie for the given provider,
 * bypassing OAuth. The session contains a single UserConnection with a
 * dummy access token (provider won't be called — events come from Postgres cache).
 */
export async function injectSession(
  page: Page,
  provider: "google" | "microsoft",
): Promise<void> {
  const password = process.env.SESSION_PASSWORD ?? "";
  const connection = {
    provider,
    userId: TEST_USER,
    email: `e2e-test@${provider}.com`,
    accessToken: "e2e-stub-token",
    refreshToken: "e2e-stub-refresh",
    // far-future expiry so no refresh is triggered
    expiresAt: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
  };

  const sealed = await sealData(
    { connections: [connection] },
    { password },
  );

  await page.context().addCookies([
    {
      name: "unified_calendar_session",
      value: sealed,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
