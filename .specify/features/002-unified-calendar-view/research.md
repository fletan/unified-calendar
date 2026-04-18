# Research: Unified Multi-Source Calendar View

**Branch**: `002-unified-calendar-view` | **Date**: 2026-04-16

## 1. Google Calendar OAuth Flow

**Decision:** Server-side authorization code exchange via Next.js Route Handlers using `googleapis` (`google-auth-library`). Scope: `https://www.googleapis.com/auth/calendar.readonly` + `openid profile email`.

**Rationale:** The OAuth client secret must never reach the browser. A Route Handler at `/api/auth/google/callback` exchanges the code for `access_token` + `refresh_token` entirely server-side. `googleapis` ships the official `OAuth2Client` which handles exchange, refresh, and scope negotiation.

**Alternatives considered:**
- NextAuth.js/Auth.js v5: large dependency, conflicts with the custom HttpOnly cookie session model; adding calendar scopes requires non-trivial workarounds. Rejected.
- Browser-side PKCE: returns tokens to the client, making HttpOnly cookies impossible without an extra round-trip. Rejected.

---

## 2. Microsoft Graph OAuth Flow

**Decision:** Server-side authorization code exchange via Next.js Route Handlers using `@azure/msal-node` (`ConfidentialClientApplication`). Scopes: `Calendars.Read offline_access openid profile email`.

**Rationale:** Same reasoning as Google — `@azure/msal-node` is Microsoft's official server-side OAuth library. `offline_access` is required to receive a refresh token. `ConfidentialClientApplication` takes `clientSecret` from server env vars only.

**Alternatives considered:**
- `@azure/msal-browser`: Stores tokens in `sessionStorage`/`localStorage`, incompatible with HttpOnly cookie strategy. Rejected.
- Manual `fetch` to token endpoint: re-implements what MSAL Node already provides (state management, token cache, PKCE). Not worth duplication. Rejected.

---

## 3. HttpOnly Cookie Token Storage

**Decision:** After server-side code exchange, serialize tokens into an encrypted, signed cookie using `iron-session`. Set with flags: `HttpOnly; Secure; SameSite=Lax; Path=/`.

**Rationale:** `iron-session` uses AES-GCM encryption (keyed by `SESSION_PASSWORD` env var ≥32 chars) providing both confidentiality and tamper-detection. The OAuth `state` parameter doubles as CSRF protection for the auth flow. `SameSite=Lax` blocks cross-origin top-level POSTs while allowing OAuth callbacks from third-party IdPs.

**Alternatives considered:**
- Database-stored sessions (session ID cookie, tokens in Postgres): stronger isolation but adds per-request DB round-trip. Revisit if user count grows. Rejected for MVP.
- `localStorage`/`sessionStorage`: XSS-accessible. Rejected.

---

## 4. Silent Token Refresh

**Decision:** A dedicated Route Handler `GET /api/auth/refresh` reads the encrypted cookie, detects near-expiry (< 5 minutes), calls the provider token endpoint, and re-writes the updated cookie. A Client Component in the root layout polls this endpoint every 4 minutes via `setInterval`. On 401 from the refresh endpoint, redirect to `/login`.

**Rationale:** Refresh tokens are in HttpOnly cookies — browser JS cannot read them. Proactive polling (every 4 minutes for 60-minute tokens) avoids 401 failures mid-view. Both Google and Microsoft access tokens expire in 3600 s; 4-minute polling is safe.

**Alternatives considered:**
- Refresh on 401 from calendar API: causes visible latency spikes and requires retry logic at every call site. Rejected.
- Next.js Middleware: cannot call external HTTPS APIs (edge runtime restriction). Rejected.

---

## 5. Event Fetch Window Strategy

**Decision:** On session load, fire two parallel Route Handler calls — `GET /api/events/google` and `GET /api/events/microsoft` — each fetching `[today − 30 days, today + 90 days]` in a single API request per provider.

**Google Calendar API v3:**
```
GET /calendar/v3/calendars/primary/events
  ?timeMin=<ISO>&timeMax=<ISO>&singleEvents=true&orderBy=startTime&maxResults=2500
```
`singleEvents=true` expands recurring events inline.

**Microsoft Graph:**
```
GET /v1.0/me/calendarView
  ?startDateTime=<ISO>&endDateTime=<ISO>&$top=999
  &$select=id,subject,start,end,isAllDay,attendees
```
`calendarView` expands recurring instances natively. Follow `@odata.nextLink` if present (defensive pagination).

**Rationale:** One large request per provider per session minimizes API quota usage and enables navigation within the fetch window without additional requests (aligns with FR-017 and SC-003).

**Alternatives considered:**
- Fetch only visible week, re-fetch on navigation: visible latency on every swipe. Rejected.
- SWR/React Query incremental fetch: over-engineered for personal calendar volumes. Rejected.

---

## 6. Server-Side Event Cache

**Decision:** Store fetched events in a single `cached_events` Postgres table:

```sql
CREATE TABLE IF NOT EXISTS cached_events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  provider    TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  payload     JSONB NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_start DATE NOT NULL,
  window_end   DATE NOT NULL,
  UNIQUE (user_id, provider)
);
```

Use `postgres` (Postgres.js) as the DB client. Invalidate (delete + re-fetch) when `fetched_at < now() - interval '5 minutes'` or window does not cover the requested range.

**Rationale:** Postgres is already in the project (Docker service `unified_calendar`). A single JSONB column per `(user_id, provider)` row stores the full `UnifiedEvent[]` without needing an ORM or migrations framework for MVP. Postgres.js is the leanest TypeScript-native Postgres client for Next.js Route Handlers.

**Alternatives considered:**
- In-memory Map: lost on restart, not shareable. Rejected.
- Redis: requires additional Docker service. Overkill when Postgres is available. Rejected.
- `next/headers` `unstable_cache`: not persistent across server restarts. Rejected for primary cache.

---

## 7. Week-View Calendar Rendering

**Decision:** Use **FullCalendar v6** (`@fullcalendar/react` + `@fullcalendar/timegrid`) wrapped in a `"use client"` Client Component.

**Rationale:** FullCalendar v6.1.15+ lists React 18/19 as peer deps. `timeGridWeek` view provides the exact hour-slotted grid required. Handles DST, overlapping events, all-day rows. License: MIT for core + timegrid. Bundle: ~85 KB gzipped — acceptable as the primary UI element, loaded only in the Client Component subtree.

**Alternatives considered:**
- `react-big-calendar`: React 19 compatibility unverified; requires `moment`/`date-fns` localizer; dated styling. Rejected.
- Custom CSS Grid: full control, no deps, but 3–5 days of implementation for overlap detection + DST + ARIA vs. ~1 day with FullCalendar. Rejected for MVP.
- `@schedule-x/react`: Smaller bundle, less adoption. Worth revisiting post-MVP if bundle size matters.

---

## 8. Vitest + Coverage Configuration

**Decision:**
- Non-UI packages (`domain`, `providers-google`, `providers-microsoft`): `environment: 'node'`, existing config pattern is correct.
- `ui` package (when React components added): `environment: 'jsdom'` + `@vitejs/plugin-react`.
- `apps/web`: `environment: 'jsdom'` + `@vitejs/plugin-react` + `@testing-library/react`. Exclude Next.js layout/page files from coverage (they are thin wrappers, not business logic). All other production source files must meet 100% threshold.

```ts
// apps/web/vitest.config.ts additions needed:
plugins: [react()],
test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] }
coverage: { exclude: ['src/app/layout.tsx', 'src/app/page.tsx', 'src/**/*.test.*'] }
```

**Rationale:** React 19 requires `@vitejs/plugin-react` v4.3+ for JSX transform. `jsdom` simulates the browser DOM for `@testing-library/react`. Next.js Server Component logic must be extracted into pure TS functions (node env, testable) — don't test layout/page shells directly, exclude them from coverage.

**Alternatives considered:**
- `happy-dom`: 2–4x faster than jsdom for large suites. Swap in if test runtime becomes a bottleneck post-MVP.
- Jest + `babel-jest`: Slower cold start, Babel config overhead. Vitest is already in place. Rejected.
