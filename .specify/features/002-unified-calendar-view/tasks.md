# Tasks: Unified Multi-Source Calendar View

**Input**: Design documents from `.specify/features/002-unified-calendar-view/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-routes.md ✅, quickstart.md ✅

**Tests**: Unit test tasks included per story to satisfy FR-014 (100% coverage). No TDD/contract test approach assumed beyond unit coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths are included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies, configure Vitest for jsdom + React, prepare env template.

- [ ] T001 Install runtime deps (`googleapis`, `@azure/msal-node`, `iron-session`, `postgres`, `@fullcalendar/react`, `@fullcalendar/timegrid`) in `apps/web/package.json`
- [ ] T002 Install dev deps (`@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/user-event`) in `apps/web/package.json`
- [ ] T003 [P] Configure `apps/web/vitest.config.ts` — add `plugins: [react()]`, `environment: 'jsdom'`, `setupFiles: ['./src/test-setup.ts']`, coverage exclusions for `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(calendar)/page.tsx`
- [ ] T004 [P] Create `apps/web/src/test-setup.ts` — global jsdom / testing-library setup
- [ ] T005 [P] Create `apps/web/.env.local.example` with all required env var keys: `SESSION_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI`, `DATABASE_URL`

**Checkpoint**: Dependencies installed, tooling configured — foundational implementation can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, session helpers, DB client, and observability — required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Update `packages/domain/src/index.ts` — add `UserConnection`, `CalendarSource`, `SyncSnapshot` interfaces; update `UnifiedEvent` with `id` (provider-prefixed), `sourceProvider: Provider`, `sourceCalendarId: string`, `allDay: boolean`; verify all exports
- [ ] T007 [P] Update `packages/providers-google/src/index.ts` — update `GoogleEventInput` to nested `start`/`end` shape (`{ dateTime?: string; date?: string; timeZone?: string }`); change `normalizeGoogleEvent` return type to `UnifiedEvent` from `@unified-calendar/domain`; update `fetchGoogleEvents(token, window)` signature
- [ ] T008 [P] Update `packages/providers-microsoft/src/index.ts` — update `MicrosoftEventInput` to nested `start`/`end` shape and add `isAllDay: boolean`; change `normalizeMicrosoftEvent` return type to `UnifiedEvent`; add `@odata.nextLink` pagination in `fetchMicrosoftEvents(token, window)`
- [ ] T009 Implement `apps/web/src/lib/session.ts` — `iron-session` cookie config (`SESSION_PASSWORD`, `httpOnly: true`, `secure`, `sameSite: 'lax'`); export `getSession`, `getSessionConnections`, `setSessionConnection(conn: UserConnection)`, `removeSessionConnection(provider: Provider)`
- [ ] T010 Implement `apps/web/src/lib/db.ts` — Postgres.js client from `DATABASE_URL`; on module load run `CREATE TABLE IF NOT EXISTS cached_events (...)` and `CREATE INDEX IF NOT EXISTS idx_cached_events_lookup (...)` per data-model.md; export `sql` tagged-template client
- [ ] T011 Implement `apps/web/src/lib/observability.ts` — export `logAuthEvent(provider, outcome: 'success'|'failure', errorType?)`, `logCalendarLoad(durationMs, eventCount, providers)`, `logProviderError(provider, errorType: 'fetch_failed'|'refresh_failed', detail?)` as structured `console.log` JSON; no tokens/emails/titles in payloads (FR-011)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Connect Multiple Calendar Accounts (Priority: P1) 🎯 MVP

**Goal**: Full server-side OAuth for Google and Microsoft, `iron-session` persistence, silent refresh poller, disconnect, and onboarding empty-state UI.

**Independent Test**: Connect one Google + one Microsoft account; verify both connections persist across page reload; verify silent refresh keeps session alive; verify disconnect removes a provider connection.

- [ ] T012 [P] [US1] Implement `apps/web/src/app/api/auth/google/route.ts` — `GET /api/auth/google`: generate OAuth2 URL via `googleapis` `OAuth2Client` (scope: `calendar.readonly openid profile email`), set short-lived `oauth_state` HttpOnly cookie for CSRF, return `302` redirect; `500` if `GOOGLE_CLIENT_ID`/`GOOGLE_REDIRECT_URI` missing; call `logAuthEvent` on error
- [ ] T013 [P] [US1] Implement `apps/web/src/app/api/auth/google/callback/route.ts` — `GET /api/auth/google/callback`: verify `state` vs `oauth_state` cookie, exchange `code` for tokens server-side, write `UserConnection` (google) to iron-session, `302` redirect to `/`; `400` on state/code error, `502` on provider unreachable; call `logAuthEvent('google', ...)`
- [ ] T014 [P] [US1] Implement `apps/web/src/app/api/auth/microsoft/route.ts` — `GET /api/auth/microsoft`: generate MSAL `ConfidentialClientApplication` auth URL (scopes: `Calendars.Read offline_access openid profile email`), set `oauth_state` cookie, `302` redirect; `500` if env vars missing; call `logAuthEvent` on error
- [ ] T015 [P] [US1] Implement `apps/web/src/app/api/auth/microsoft/callback/route.ts` — `GET /api/auth/microsoft/callback`: verify state, exchange code via MSAL Node, write `UserConnection` (microsoft) to session, `302` redirect to `/`; `400`/`502` error handling per contract; call `logAuthEvent('microsoft', ...)`
- [ ] T016 [US1] Implement `apps/web/src/app/api/auth/disconnect/route.ts` — `POST /api/auth/disconnect`: read `{ provider }` from body, call `removeSessionConnection(provider)`, return `200 { ok: true }`; `400` on invalid provider value
- [ ] T017 [US1] Implement `apps/web/src/app/api/auth/refresh/route.ts` — `GET /api/auth/refresh`: for each connected provider with `expiresAt < now + 5min`, call provider token endpoint, update session; return `200 { refreshed: Provider[] }`; `401 { provider, reason: 'refresh_failed' }` on revoked token; call `logProviderError` on failure
- [ ] T018 [US1] Implement `apps/web/src/app/api/session/route.ts` — `GET /api/session`: read session connections, return `{ connections: [{ provider, email, expiresAt }] }` or `{ connections: [] }` when none (never `401`)
- [ ] T019 [US1] Implement `apps/web/src/components/TokenRefreshPoller.tsx` — `"use client"` component; `setInterval` every 4 minutes calling `GET /api/auth/refresh`; on `401` redirect to `/`; mount in `apps/web/src/app/layout.tsx`
- [ ] T020 [US1] Implement `apps/web/src/components/OnboardingPrompt.tsx` — `"use client"` component; "Connect Google" button linking to `/api/auth/google` and "Connect Microsoft" button linking to `/api/auth/microsoft`; shown when `connections.length === 0`
- [ ] T021 [US1] Wire `apps/web/src/app/layout.tsx` — root layout: mount `<TokenRefreshPoller />`
- [ ] T022 [US1] Wire `apps/web/src/app/page.tsx` — landing page: fetch `GET /api/session`; render `<OnboardingPrompt />` if no connections; redirect to `/(calendar)` if connected
- [ ] T023 [US1] Write unit tests for pure functions extracted from US1 route handlers (state-cookie generation/verification, token-expiry check, session helpers, observability auth log shape); achieve 100% coverage for `apps/web/src/lib/session.ts`, `apps/web/src/lib/observability.ts`, and extracted auth pure functions; confirm `pnpm test:coverage` passes

**Checkpoint**: User Story 1 fully functional — both OAuth flows complete, session persists, silent refresh polls every 4 min, onboarding renders when no providers connected.

---

## Phase 4: User Story 2 — View Unified Calendar Events (Priority: P2)

**Goal**: Fetch events from both providers, cache in Postgres with 5-min TTL, merge into `UnifiedEvent[]`, render in FullCalendar `timeGridWeek`, show per-provider stale banners on partial failure.

**Independent Test**: With both providers connected, verify known events from Google and Microsoft appear together in the week-view with correct `sourceProvider` metadata; simulate one provider fetch failure and confirm stale cached events + warning banner render while the other provider continues normally.

- [ ] T024 [US2] Implement `apps/web/src/lib/events.ts` — export `getCachedSnapshot(userId, provider)`, `upsertSnapshot(snapshot: SyncSnapshot)`, `isStale(snapshot): boolean` (stale if `fetched_at < now − 5min` OR window doesn't cover `[today−30d, today+90d]`), `getOrFetchEvents(userId, provider, connection): Promise<{ snapshot: SyncSnapshot; stale: boolean }>`, `mergeProviderEvents(snapshots: SyncSnapshot[]): UnifiedEvent[]`
- [ ] T025 [US2] Implement `apps/web/src/app/api/events/route.ts` — `GET /api/events`: read session connections; for each provider call `getOrFetchEvents`; call `mergeProviderEvents`; return `200` with full shape per contract (events + meta with `windowStart`, `windowEnd`, per-provider `fetchedAt`/`stale`); return `206 Partial Content` when any provider `stale=true` due to fetch failure (FR-007); `401` if no session; call `logCalendarLoad(duration, count, providers)`; call `logProviderError` on fetch failures
- [ ] T026 [US2] Implement `apps/web/src/components/WeekView.tsx` — `"use client"` component; accept `events: UnifiedEvent[]` prop; render `<FullCalendar plugins={[timeGridPlugin]} initialView="timeGridWeek" events={...} />` mapping `UnifiedEvent` to FullCalendar event objects (`extendedProps: { sourceProvider }` for color coding)
- [ ] T027 [US2] Implement `apps/web/src/components/ProviderBanner.tsx` — `"use client"` component; accept `providers: { provider: Provider; stale: boolean }[]` prop; render a warning banner for each provider where `stale === true`
- [ ] T028 [US2] Implement `apps/web/src/app/(calendar)/page.tsx` — Server Component shell: fetch `GET /api/events`; pass `events` to `<WeekView />`; pass provider meta to `<ProviderBanner />`; redirect to `/` on `401`
- [ ] T029 [US2] Write unit tests for pure functions extracted from US2 logic (`events.ts` stale-check, cache read/write, merge logic; `GET /api/events` response-shape assembly; `WeekView` event mapping; `ProviderBanner` stale rendering); achieve 100% coverage for `apps/web/src/lib/events.ts`, `apps/web/src/lib/db.ts`, `providers-google`, `providers-microsoft`; confirm `pnpm test:coverage` passes

**Checkpoint**: User Stories 1 AND 2 independently functional — unified calendar renders events from all connected providers with partial-failure resilience and stale banners.

---

## Phase 5: User Story 3 — Manage Visible Calendars (Priority: P3)

**Goal**: Per-calendar visibility toggles in a sidebar; filter `WeekView` events by visible `CalendarSource[]`; client-side state only, resets on reload.

**Independent Test**: Toggle one connected calendar off; verify its events disappear from `WeekView`; toggle back on; verify events reappear — without disconnecting the provider.

- [ ] T030 [US3] Create `apps/web/src/components/CalendarContext.tsx` — React context providing `calendarSources: CalendarSource[]` and `toggleVisibility(provider: Provider, calendarId: string): void`; initialize one `CalendarSource` per connected provider (from `GET /api/session`) with `visible: true`; wrap calendar page subtree
- [ ] T031 [US3] Implement `apps/web/src/components/CalendarSidebar.tsx` — `"use client"` component; consume `CalendarContext`; render `providerBadge` (from `packages/ui`) + checkbox toggle per `CalendarSource`; call `toggleVisibility` on toggle
- [ ] T032 [US3] Update `apps/web/src/components/WeekView.tsx` — consume `CalendarContext`; filter `events` prop to only include entries where `event.sourceProvider` matches a `CalendarSource` with `visible: true`
- [ ] T033 [US3] Update `apps/web/src/app/(calendar)/page.tsx` — wrap with `<CalendarContext.Provider>`; render `<CalendarSidebar />` alongside `<WeekView />`
- [ ] T034 [US3] Write unit tests for `CalendarContext` toggle logic, `CalendarSidebar` toggle interaction, `WeekView` visibility filtering; achieve 100% coverage for `CalendarContext.tsx`, `CalendarSidebar.tsx`, updated `WeekView.tsx`; confirm `pnpm test:coverage` passes

**Checkpoint**: All three user stories independently functional — unified calendar with per-provider visibility toggles.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Shared package additions, security hardening, final coverage gate, constitution compliance.

- [ ] T035 [P] Add `packages/ui/src/index.ts` additions — implement `providerBadge(provider: Provider): { label: string; color: string }` utility; achieve 100% unit coverage for `ui` package
- [ ] T036 [P] Add `packages/test-utils/src/index.ts` additions — implement `expectNever`, `isDefined`, and fixture builders for `UnifiedEvent`, `UserConnection`, `CalendarSource`; achieve 100% coverage for `test-utils` package
- [ ] T037 Security audit — verify: `oauth_state` cookie is `HttpOnly` and checked in both OAuth callbacks (CSRF); session cookie has `httpOnly: true`, `secure`, `sameSite: 'lax'`; `observability.ts` payloads contain no tokens/emails/titles; `cached_events` rows are `user_id`-scoped; no event descriptions/attachments cached (FR-011)
- [ ] T038 Run `pnpm lint` and `pnpm typecheck` across monorepo; resolve all errors
- [ ] T039 Run `pnpm test:coverage` for all packages; confirm 100% threshold passes in CI (FR-014, SC-005)
- [ ] T040 Validate quickstart.md flow end-to-end: `pnpm install` → `docker compose up -d` → configure `.env.local` → `pnpm dev` → connect Google → connect Microsoft → verify unified week-view renders → verify visibility toggles work
- [ ] T041 Capture constitution compliance evidence for PR description: trace FR-001–FR-017 and SC-001–SC-005 fulfillment; confirm no breaking changes to existing interfaces (FR-013)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 — **blocks all user stories**
- **US1 (Phase 3)**: Requires Phase 2
- **US2 (Phase 4)**: Requires Phase 3 (provider tokens needed for event fetch)
- **US3 (Phase 5)**: Requires Phase 4 (`WeekView` and session connections must exist)
- **Polish (Phase 6)**: Requires all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational — no story dependencies
- **US2 (P2)**: Requires US1 session/auth layer (provider `accessToken` needed to fetch events)
- **US3 (P3)**: Requires US2 `WeekView` component and connected `CalendarSource[]`

### Within Each Story

- Shared lib tasks before route handler tasks
- Route handlers before component wiring
- Components before page-level wiring
- Unit tests after pure-function extraction, before checkpoint

### Parallel Opportunities

- T003, T004, T005 — independent setup files (Phase 1)
- T007, T008 — independent provider packages (Phase 2)
- T009, T010, T011 — independent lib files (Phase 2)
- T012, T013, T014, T015 — independent route files per provider (Phase 3)
- T035, T036 — independent shared packages (Phase 6)

---

## Parallel Example: User Story 1

```bash
# Google and Microsoft OAuth initiators — independent files, run in parallel:
Task T012: apps/web/src/app/api/auth/google/route.ts
Task T014: apps/web/src/app/api/auth/microsoft/route.ts

# Then callbacks in parallel (after T012/T014 define the state cookie shape):
Task T013: apps/web/src/app/api/auth/google/callback/route.ts
Task T015: apps/web/src/app/api/auth/microsoft/callback/route.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE** — both OAuth flows work, session persists, onboarding renders
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → shared infrastructure ready
2. User Story 1 → OAuth + session → validate independently → Demo (MVP!)
3. User Story 2 → Unified event view → validate independently → Demo
4. User Story 3 → Visibility toggles → validate independently → Demo
5. Polish → coverage gate → Ship

---

## Notes

- [P] tasks = different files with no shared-state dependencies — safe to parallelize
- [Story] label maps each task to a user story for traceability to spec.md
- Coverage enforced by `pnpm test:coverage` at 100% threshold across all packages (CI gate — SC-005)
- Next.js `layout.tsx` and `page.tsx` shells excluded from coverage per research.md decision 8
- Route Handler tests cover extracted pure functions only — `Response`-wiring excluded alongside page shells
- `CalendarSource` visibility is client-side in-memory state only — resets on reload by design (MVP)
