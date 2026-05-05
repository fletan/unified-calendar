# Implementation Plan: Unified Multi-Source Calendar View

**Branch**: `002-unified-calendar-view` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `.specify/features/002-unified-calendar-view/spec.md`

## Summary

Build a browser-based unified calendar web app (Next.js 15 App Router + TypeScript) that authenticates against Google Calendar and Microsoft Graph via server-side OAuth, caches events in Postgres, and renders them together in a FullCalendar week-view. The MVP is read-only, supports visibility toggling per calendar, and handles partial provider failures gracefully.

## Technical Context

**Language/Version**: TypeScript 5.7 / Node.js 22  
**Primary Dependencies**: Next.js 15.0.4, React 19, `googleapis`, `@azure/msal-node`, `iron-session`, `postgres` (Postgres.js), `@fullcalendar/react` + `@fullcalendar/timegrid`  
**Storage**: PostgreSQL 16 (Docker service `unified_calendar`, `cached_events` table)  
**Testing**: Vitest 2.x + `@testing-library/react`, `@vitejs/plugin-react`, jsdom; 100% unit coverage enforced in CI  
**Target Platform**: Browser (web app), Next.js deployed on Node.js 22 server  
**Project Type**: Web application (monorepo: Next.js app + shared packages)  
**Performance Goals**: 95% of calendar loads complete in < 5 s for up to 500 events (SC-003)  
**Constraints**: OAuth tokens in HttpOnly cookies only; event metadata user-scoped in Postgres; no write operations to provider calendars  
**Scale/Scope**: Single user, two providers, ~500 events across a 4-month window

## Constitution Check

_GATE: Passed before Phase 0 research. Re-checked after Phase 1 design below._

- **Spec-Driven Delivery**: ✅ Plan references FR-001–FR-018, SC-001–SC-006, and all three user story acceptance scenarios. Every component traces to a requirement.
- **Testable Increments**: ✅ Each user story (P1: auth, P2: unified view, P3: visibility) is independently implementable and verifiable. Story-level test criteria defined in spec. The feature includes E2E tests scoped to confirm system integration across all main components (FR-018).
- **Coverage Gate**: ✅ Vitest v8 with 100% threshold enforced in CI (`pnpm test:coverage`). Per-package configs include `src/**/*.ts(x)` with Next.js layout/page files excluded from measurement (they are thin shells, not business logic). See research item 8.
- **End-to-End Test**: ✅ At least one E2E test for the feature, exercising the full stack (browser → Next.js → Postgres), scoped to confirm system integration across all main components. Provider-specific tests (Google, Microsoft) are warranted here because each provider has a distinct fetch path through the system (FR-018, SC-006). See Test Strategy table.
- **Security and Privacy**: ✅ OAuth tokens stored in `iron-session` encrypted HttpOnly cookies. Cached event metadata scoped to `user_id`. No descriptions/attachments cached. No sensitive data in logs (FR-011).
- **Observability and Operability**: ✅ Auth events, calendar load latency, and provider error rates instrumented per FR-012. Stale cache detection surfaces a provider-specific warning banner per FR-007.
- **Simplicity and Compatibility**: ✅ Greenfield MVP — no prior external version, no migration plan required. `UnifiedEvent` in `packages/domain` receives additive fields (`id`, `sourceProvider`, `sourceCalendarId`, `allDay`) — semver-minor change, all internal callers updated in this feature (FR-013). No unnecessary abstractions: no ORM (single Postgres table), no state management library (React context only), no extra auth framework.

_Post-design re-check: No violations introduced by Phase 1 design. Complexity tracking table not required._

## Project Structure

### Documentation (this feature)

```text
.specify/features/002-unified-calendar-view/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── api-routes.md    ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
apps/
  web/
    src/
      app/
        api/
          auth/
            google/
              route.ts          # GET /api/auth/google — initiates redirect
            google/callback/
              route.ts          # GET /api/auth/google/callback
            microsoft/
              route.ts          # GET /api/auth/microsoft
            microsoft/callback/
              route.ts          # GET /api/auth/microsoft/callback
            refresh/
              route.ts          # GET /api/auth/refresh
            disconnect/
              route.ts          # POST /api/auth/disconnect
          events/
            route.ts            # GET /api/events
          session/
            route.ts            # GET /api/session
        (calendar)/
          page.tsx              # Authenticated calendar page (Server Component shell)
        page.tsx                # Landing / onboarding page
        layout.tsx              # Root layout — mounts token refresh poller
      components/
        WeekView.tsx            # FullCalendar timeGridWeek (Client Component)
        CalendarSidebar.tsx     # Provider badges + visibility toggles (Client Component)
        OnboardingPrompt.tsx    # Empty state — connect buttons
        ProviderBanner.tsx      # Stale/error banner per provider
        TokenRefreshPoller.tsx  # setInterval refresh client component
      lib/
        session.ts              # iron-session cookie config + helpers
        db.ts                   # Postgres.js client + CREATE TABLE IF NOT EXISTS
        events.ts               # Cache orchestration: read, invalidate, fetch, write
        observability.ts        # Structured log helpers for auth/load/error signals (FR-012)

packages/
  domain/
    src/
      index.ts                  # Provider, UnifiedEvent, UserConnection, CalendarSource, SyncSnapshot
  providers-google/
    src/
      index.ts                  # GoogleEventInput (updated shape), normalizeGoogleEvent → UnifiedEvent, fetchGoogleEvents(token, window)
  providers-microsoft/
    src/
      index.ts                  # MicrosoftEventInput (updated shape), normalizeMicrosoftEvent → UnifiedEvent, fetchMicrosoftEvents(token, window)
  ui/
    src/
      index.ts                  # providerBadge, UI_PACKAGE_READY (existing + additions)
  test-utils/
    src/
      index.ts                  # expectNever, isDefined, test fixture builders
  config-typescript/            # shared tsconfig (no changes)
```

**Structure Decision**: Web application monorepo (Option 2 from template). Backend logic lives in Next.js Route Handlers (`apps/web/src/app/api/`). Shared domain types, provider normalization, UI primitives, and test utilities are isolated packages. No separate `backend/` directory — Route Handlers serve as the API layer.

## Complexity Tracking

No constitution violations. Table not required.

---

## Phase 0: Research Summary

All unknowns resolved. See [research.md](./research.md) for full decisions and rationale.

| Unknown                    | Resolution                                                       |
| -------------------------- | ---------------------------------------------------------------- |
| Google OAuth in Next.js    | Server-side code exchange via Route Handler, `googleapis`        |
| Microsoft OAuth in Next.js | `@azure/msal-node` `ConfidentialClientApplication`               |
| Token storage              | `iron-session` encrypted HttpOnly cookie                         |
| Silent refresh             | `GET /api/auth/refresh` polled every 4 min from Client Component |
| Event fetch window         | −30 days / +90 days, single batch per provider                   |
| Server-side cache          | Postgres `cached_events` table, Postgres.js, 5-min TTL           |
| Week-view rendering        | FullCalendar v6 `timeGridWeek`, MIT, React 19 compatible         |
| Vitest + jsdom             | `@vitejs/plugin-react` + `jsdom`, layout/page files excluded     |

---

## Phase 1: Design Decisions

### Data Model

See [data-model.md](./data-model.md).

Key decisions:

- `UnifiedEvent.id` is provider-prefixed (`"google:eventId"`) to guarantee uniqueness across providers.
- `UserConnection` lives in the encrypted session cookie only — never in the database.
- `CalendarSource` visibility is client-side React state only in MVP (resets on reload to `visible: true`).
- `cached_events` Postgres table stores `payload JSONB` (serialized `UnifiedEvent[]`) per `(user_id, provider)`.

### API Contracts

See [contracts/api-routes.md](./contracts/api-routes.md).

Key route decisions:

- `GET /api/session` returns `{ connections: [] }` (not 401) when no providers are connected — drives the onboarding empty-state UI without requiring error handling on the client.
- `GET /api/events` returns `206 Partial Content` with `meta.providers[n].stale = true` for degraded providers, preserving stale data per FR-007.
- `GET /api/auth/refresh` returns `{ refreshed: Provider[] }` — the browser-side poller only needs to check for 401 to know when to redirect to re-auth.

### Observability Instrumentation (FR-012)

`apps/web/src/lib/observability.ts` emits structured `console.log` JSON entries for three signal types:

```ts
logAuthEvent(provider, outcome: 'success' | 'failure', errorType?: string)
logCalendarLoad(durationMs: number, eventCount: number, providers: Provider[])
logProviderError(provider: Provider, errorType: 'fetch_failed' | 'refresh_failed', detail?: string)
```

No sensitive data (tokens, emails, event titles) in log payloads.

### Test Strategy

| Layer                            | Environment                      | Library  | Coverage target       |
| -------------------------------- | -------------------------------- | -------- | --------------------- |
| `domain` pure logic              | node                             | vitest   | 100%                  |
| `providers-google` normalizer    | node                             | vitest   | 100%                  |
| `providers-microsoft` normalizer | node                             | vitest   | 100%                  |
| `ui` utilities                   | node (jsdom if components added) | vitest   | 100%                  |
| `test-utils` helpers             | node                             | vitest   | 100%                  |
| Route Handler logic              | node (extracted pure fns)        | vitest   | 100%                  |
| React Client Components          | jsdom + `@testing-library/react` | vitest   | 100%                  |
| Next.js layout/page shells       | excluded from coverage           | —        | —                     |
| Integration: `GET /api/events`   | node + real Postgres (Docker)    | vitest   | contract shape        |
| Performance benchmark            | node + real Postgres (Docker)    | vitest   | P95 < 5 s             |
| **E2E — Google events in calendar** | browser + Next.js + Postgres  | Playwright | Google events visible in week-view |
| **E2E — Microsoft events in calendar** | browser + Next.js + Postgres | Playwright | Microsoft events visible in week-view |

Route Handler tests cover the extracted pure functions (token validation, cache logic, event normalization) rather than the `Response`-wiring — the latter is excluded from coverage alongside layout/page shells.

The integration test for `GET /api/events` connects to the Docker Postgres instance (`DATABASE_URL` from `.env.test`), seeds provider snapshots, calls the handler's pure orchestration layer, and asserts the response shape matches `contracts/api-routes.md`. OAuth token exchange is not exercised — a fixture `UserConnection` is injected directly into the session helper. This satisfies Constitution Principle IV's requirement for at least one integration or contract-level verification path on critical flows.

The feature MUST have at least one Playwright end-to-end test that drives a real browser against the running Next.js dev/test server backed by Docker Postgres. Tests are scoped to confirm that all main components (browser, Next.js route handlers, Postgres) work and communicate correctly — not to duplicate unit or integration test coverage. For this feature, separate tests per provider are warranted because Google and Microsoft follow distinct fetch paths through the system, and verifying each end-to-end catches provider-specific integration failures that unit tests cannot. OAuth provider redirects are stubbed at the network level (no real credentials required in CI). E2E tests live in `apps/web/e2e/` and are run separately from the Vitest suite. They are excluded from the unit coverage gate but are required to pass in CI before the feature is considered done (FR-018, SC-006).

### New Package Dependencies

| Package                       | Location         | Purpose                              |
| ----------------------------- | ---------------- | ------------------------------------ |
| `googleapis`                  | `apps/web`       | Google OAuth2 + Calendar API         |
| `@azure/msal-node`            | `apps/web`       | Microsoft OAuth2                     |
| `iron-session`                | `apps/web`       | Encrypted HttpOnly session cookies   |
| `postgres`                    | `apps/web`       | Postgres.js DB client                |
| `@fullcalendar/react`         | `apps/web`       | Calendar week-view renderer          |
| `@fullcalendar/timegrid`      | `apps/web`       | `timeGridWeek` plugin                |
| `@vitejs/plugin-react`        | `apps/web` (dev) | JSX transform for Vitest jsdom tests |
| `@testing-library/react`      | `apps/web` (dev) | Client Component unit tests          |
| `@testing-library/user-event` | `apps/web` (dev) | User interaction simulation          |

---

## Delivery Order (by user story priority)

**P1 — User Story 1: Connect Multiple Calendar Accounts**

1. Update `packages/domain` types (`UserConnection`, `CalendarSource`, `SyncSnapshot`)
2. Implement `apps/web/src/lib/session.ts` (iron-session helpers)
3. Implement Google OAuth routes (`/api/auth/google`, `/api/auth/google/callback`)
4. Implement Microsoft OAuth routes (`/api/auth/microsoft`, `/api/auth/microsoft/callback`)
5. Implement `GET /api/session` and `POST /api/auth/disconnect`
6. Implement `GET /api/auth/refresh` + `TokenRefreshPoller` Client Component
7. Build `OnboardingPrompt` component (empty state)

**P2 — User Story 2: View Unified Calendar Events**

8. Update `packages/providers-google` (correct input shape, return `UnifiedEvent`)
9. Update `packages/providers-microsoft` (correct input shape, return `UnifiedEvent`)
10. Implement `apps/web/src/lib/db.ts` (Postgres.js client + `CREATE TABLE IF NOT EXISTS`)
11. Implement `apps/web/src/lib/events.ts` (cache orchestration)
12. Implement `GET /api/events`
13. Build `WeekView` Client Component (FullCalendar)
14. Build `ProviderBanner` (stale/error indicator)
15. Wire calendar page + root layout

**P3 — User Story 3: Manage Visible Calendars**

16. Build `CalendarSidebar` (provider badges + visibility toggles)
17. Add React context for `CalendarSource[]` visibility state
18. Filter `UnifiedEvent[]` in `WeekView` by visible calendar sources
