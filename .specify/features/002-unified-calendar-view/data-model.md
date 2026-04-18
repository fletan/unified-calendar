# Data Model: Unified Multi-Source Calendar View

**Branch**: `002-unified-calendar-view` | **Date**: 2026-04-16

## Package: `@unified-calendar/domain`

Central canonical types shared across all packages.

### `Provider`

```ts
type Provider = "google" | "microsoft";
```

Already defined in `packages/domain/src/index.ts`. No change needed.

### `UnifiedEvent`

Normalized event for rendering in the unified week-view calendar.

```ts
interface UnifiedEvent {
  id: string;                  // provider-scoped event ID (e.g., "google:abc123")
  sourceProvider: Provider;    // originating provider
  sourceCalendarId: string;    // calendar ID within provider (e.g., "primary")
  title: string;               // event title / subject
  startIso: string;            // ISO 8601 datetime string (e.g., "2026-04-16T09:00:00Z")
  endIso: string;              // ISO 8601 datetime string
  allDay: boolean;             // true if the event has no specific time
}
```

Already defined in `packages/domain/src/index.ts`. Add: `id` must be unique across providers by including `sourceProvider` as a prefix (e.g., `"google:eventId123"`).

### `UserConnection`

Represents a user's authenticated relationship to one provider account. Stored in the encrypted `iron-session` cookie.

```ts
interface UserConnection {
  provider: Provider;
  userId: string;              // provider-specific user ID (from id_token sub claim)
  email: string;               // display identifier
  accessToken: string;         // current access token
  refreshToken: string;        // refresh token (required for silent refresh)
  expiresAt: number;           // Unix epoch seconds when access token expires
}
```

Storage: encrypted inside the `iron-session` cookie (not persisted to DB). The session cookie holds at most two `UserConnection` entries (one per provider).

### `CalendarSource`

A calendar available under a connected provider account.

```ts
interface CalendarSource {
  provider: Provider;
  calendarId: string;          // provider-specific calendar identifier
  name: string;                // display name (e.g., "ian@gmail.com", "Work Calendar")
  visible: boolean;            // user-controlled visibility toggle
}
```

Storage: In-memory client-side state (React context). Visibility toggle is not persisted in MVP — resets on page reload to `visible: true`.

### `SyncSnapshot`

Represents the latest retrieved dataset for a connected provider. Stored in Postgres.

```ts
interface SyncSnapshot {
  userId: string;
  provider: Provider;
  events: UnifiedEvent[];      // full event list for the fetch window
  fetchedAt: Date;             // when the data was last retrieved
  windowStart: Date;           // start of the fetched range (today − 30 days)
  windowEnd: Date;             // end of the fetched range (today + 90 days)
}
```

Maps 1:1 to the `cached_events` Postgres table.

---

## Database Schema

### `cached_events`

Single table in the `unified_calendar` Postgres database. One row per `(user_id, provider)`.

```sql
CREATE TABLE IF NOT EXISTS cached_events (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT        NOT NULL,
  provider     TEXT        NOT NULL CHECK (provider IN ('google', 'microsoft')),
  payload      JSONB       NOT NULL,     -- serialized UnifiedEvent[]
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_start DATE        NOT NULL,
  window_end   DATE        NOT NULL,
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_cached_events_lookup
  ON cached_events (user_id, provider);
```

Invalidation rule: re-fetch if `fetched_at < now() − interval '5 minutes'` OR the stored `(window_start, window_end)` does not cover `[today − 30 days, today + 90 days]`.

---

## Package: `@unified-calendar/providers-google`

### `GoogleEventInput` (raw API response shape)

```ts
interface GoogleEventInput {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end:   { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
}
```

Currently defined with flat `start`/`end` strings — needs update to match the actual Google Calendar API v3 response shape (nested `dateTime`/`date` objects).

### `NormalizedGoogleEvent` → replaced by `UnifiedEvent`

The `NormalizedGoogleEvent` type in `providers-google` duplicates `UnifiedEvent` from `domain`. Replace `normalizeGoogleEvent` return type with `UnifiedEvent` (imported from `@unified-calendar/domain`).

---

## Package: `@unified-calendar/providers-microsoft`

### `MicrosoftEventInput` (raw API response shape)

```ts
interface MicrosoftEventInput {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end:   { dateTime: string; timeZone: string };
  isAllDay: boolean;
  attendees?: Array<{ emailAddress: { address: string; name: string } }>;
}
```

Currently defined with flat `start`/`end` strings — needs update to match the actual Microsoft Graph response shape.

### `NormalizedMicrosoftEvent` → replaced by `UnifiedEvent`

Same as Google: replace return type with `UnifiedEvent` from `@unified-calendar/domain`.

---

## State Transitions

### `UserConnection.expiresAt`

```
[no token] ──auth flow──▶ [active: expiresAt > now]
                                   │
                    [expiresAt < now + 5min] ──silent refresh──▶ [active: updated expiresAt]
                                   │
                         [refresh fails] ──▶ [revoked: redirect to /login]
```

### `SyncSnapshot` cache lifecycle

```
[missing] ──fetch──▶ [fresh: fetched_at = now]
[fresh]   ──5min──▶  [stale: fetched_at < now − 5min]
[stale]   ──fetch──▶ [fresh: fetched_at = now]
```

---

## Entity Relationships

```
Session Cookie
  └── UserConnection[google]  (0 or 1)
  └── UserConnection[microsoft]  (0 or 1)

Postgres: cached_events
  └── SyncSnapshot[google]  ──▶  UnifiedEvent[]
  └── SyncSnapshot[microsoft]  ──▶  UnifiedEvent[]

Client State (React Context)
  └── CalendarSource[]  (one per connected provider, visible=true by default)
  └── UnifiedEvent[]  (merged + filtered by visible CalendarSource[])
```
