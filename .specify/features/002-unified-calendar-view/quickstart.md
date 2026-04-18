# Quickstart: Unified Multi-Source Calendar View

**Branch**: `002-unified-calendar-view` | **Date**: 2026-04-16

## Prerequisites

- Node.js 22 (see CI: `.github/workflows/ci.yml`)
- pnpm 10.33.0
- Docker (for Postgres)
- Google Cloud Console app with Calendar API enabled
- Azure AD app registration with `Calendars.Read` delegated permission

## 1. Install dependencies

```bash
pnpm install
```

## 2. Start Postgres

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

Postgres will be available at `localhost:5432`, database `unified_calendar`.

## 3. Configure environment variables

Create `apps/web/.env.local`:

```env
SESSION_PASSWORD=<generate with: openssl rand -base64 32>

GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

MICROSOFT_CLIENT_ID=<from Azure Portal>
MICROSOFT_CLIENT_SECRET=<from Azure Portal>
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback

DATABASE_URL=postgres://postgres:postgres@localhost:5432/unified_calendar
```

## 4. Run the development server

```bash
pnpm dev
```

Opens at `http://localhost:3000`.

## 5. Connect providers

1. Open `http://localhost:3000`
2. Click "Connect Google" → complete OAuth consent → redirected back
3. Click "Connect Microsoft" → complete OAuth consent → redirected back
4. Unified week-view calendar loads with events from both providers

## 6. Run tests

```bash
pnpm test              # all packages, no coverage
pnpm test:coverage     # all packages, enforces 100% unit coverage
```

## 7. Run linter / type-check

```bash
pnpm lint
pnpm typecheck
```

## Package Structure

```
apps/
  web/                        # Next.js 15 App Router web application
    src/
      app/
        api/
          auth/google/        # Google OAuth routes
          auth/microsoft/     # Microsoft OAuth routes
          auth/refresh/       # Silent token refresh
          auth/disconnect/    # Provider disconnect
          events/             # Unified event fetch + cache
          session/            # Session state
        (calendar)/           # Route group: authenticated calendar UI
          page.tsx            # Week-view calendar page
        page.tsx              # Landing / onboarding page
      components/
        WeekView.tsx          # FullCalendar week-view (Client Component)
        CalendarSidebar.tsx   # Provider badges + visibility toggles (Client Component)
        OnboardingPrompt.tsx  # Empty state with connect buttons
        ProviderBanner.tsx    # Stale data / error banner per provider
      lib/
        session.ts            # iron-session cookie helpers
        db.ts                 # Postgres.js client + schema bootstrap
        events.ts             # Cache read/write + provider fetch orchestration

packages/
  domain/                     # Canonical types: Provider, UnifiedEvent, UserConnection, etc.
  providers-google/           # Google Calendar API normalizer + fetch
  providers-microsoft/        # Microsoft Graph normalizer + fetch
  ui/                         # Shared UI primitives (providerBadge, etc.)
  test-utils/                 # Shared test helpers (expectNever, isDefined, etc.)
  config-typescript/          # Shared tsconfig base files
```

## Key Decisions (see research.md for full rationale)

| Concern             | Decision                                                           |
| ------------------- | ------------------------------------------------------------------ |
| OAuth token storage | `iron-session` encrypted HttpOnly cookie                           |
| Silent refresh      | Polling Route Handler every 4 min from root layout                 |
| Event fetch window  | −30 days / +90 days, single batch per provider per session         |
| Event cache         | Postgres `cached_events` table, 5-min TTL, Postgres.js client      |
| Calendar UI         | FullCalendar v6 `timeGridWeek`, MIT license, React 19 compatible   |
| Test coverage       | Vitest v8, 100% threshold all packages, jsdom for React components |
