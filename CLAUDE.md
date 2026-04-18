# unified-calendar Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-16

## Active Technologies

- TypeScript 5.7 / Node.js 22 + Next.js 15.0.4, React 19, `googleapis`, `@azure/msal-node`, `iron-session`, `postgres` (Postgres.js), `@fullcalendar/react` + `@fullcalendar/timegrid` (002-unified-calendar-view)

## Project Structure

```text
apps/web/src/          # Next.js 15 App Router (Route Handlers + React components)
packages/domain/       # Canonical TypeScript types (UnifiedEvent, Provider, etc.)
packages/providers-google/    # Google Calendar normalizer + fetch
packages/providers-microsoft/ # Microsoft Graph normalizer + fetch
packages/ui/           # Shared UI utilities
packages/test-utils/   # Shared test helpers
infra/docker/          # docker-compose.yml (Postgres 16)
```

## Commands

```bash
pnpm install
docker compose -f infra/docker/docker-compose.yml up -d
pnpm dev          # start Next.js dev server
pnpm test         # run all tests
pnpm test:coverage # run with 100% coverage enforcement
pnpm lint
pnpm typecheck
```

## Code Style

TypeScript 5.7 / Node.js 22: Follow standard conventions

## Recent Changes

- 002-unified-calendar-view: Added TypeScript 5.7 / Node.js 22 + Next.js 15.0.4, React 19, `googleapis`, `@azure/msal-node`, `iron-session`, `postgres` (Postgres.js), `@fullcalendar/react` + `@fullcalendar/timegrid`

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
