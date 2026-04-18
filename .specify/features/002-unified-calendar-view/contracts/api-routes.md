# API Route Contracts: Unified Multi-Source Calendar View

**Branch**: `002-unified-calendar-view` | **Date**: 2026-04-16

All routes are Next.js App Router Route Handlers under `apps/web/src/app/api/`.

---

## Authentication Routes

### `GET /api/auth/google`

Initiates Google OAuth redirect.

**Query params**: none  
**Response**: `302 Redirect` → Google authorization URL  
**Side effects**: Sets a short-lived `oauth_state` HttpOnly cookie for CSRF verification  
**Errors**: `500` if `GOOGLE_CLIENT_ID` or `GOOGLE_REDIRECT_URI` env vars are missing

---

### `GET /api/auth/google/callback`

Handles Google OAuth callback after user grants consent.

**Query params**: `code: string`, `state: string`  
**Response**: `302 Redirect` → `/` (on success)  
**Side effects**: Exchanges `code` for tokens server-side; writes encrypted `iron-session` cookie with `UserConnection` for Google  
**Errors**:
- `400` if `state` does not match `oauth_state` cookie (CSRF)
- `400` if `code` is missing or invalid
- `502` if Google token endpoint is unreachable

---

### `GET /api/auth/microsoft`

Initiates Microsoft OAuth redirect.

**Query params**: none  
**Response**: `302 Redirect` → Microsoft authorization URL (MSAL Node)  
**Side effects**: Sets a short-lived `oauth_state` HttpOnly cookie  
**Errors**: `500` if `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, or `MICROSOFT_REDIRECT_URI` env vars are missing

---

### `GET /api/auth/microsoft/callback`

Handles Microsoft OAuth callback.

**Query params**: `code: string`, `state: string`  
**Response**: `302 Redirect` → `/` (on success)  
**Side effects**: Exchanges `code` for tokens; writes/updates encrypted session cookie with `UserConnection` for Microsoft  
**Errors**:
- `400` if state mismatch
- `400` if code invalid
- `502` if Microsoft token endpoint unreachable

---

### `POST /api/auth/disconnect`

Disconnects a provider (removes its `UserConnection` from session).

**Body**: `{ provider: "google" | "microsoft" }`  
**Response**: `200 { ok: true }`  
**Side effects**: Removes provider entry from encrypted session cookie; does NOT revoke the OAuth token at the provider (out of scope for MVP)  
**Errors**: `400` if `provider` is not a valid value

---

### `GET /api/auth/refresh`

Silently refreshes access tokens for all connected providers.

**Query params**: none  
**Response**: `200 { refreshed: Provider[] }` — list of providers that were refreshed  
**Side effects**: For each provider with `expiresAt < now + 5min`, calls provider token endpoint and re-writes updated session cookie  
**Errors**:
- `401 { provider: "google" | "microsoft", reason: "refresh_failed" }` if refresh token is expired/revoked for any provider; browser should redirect to `/login` for that provider
- `200 { refreshed: [] }` if no tokens needed refreshing (no-op)

---

## Event Routes

### `GET /api/events`

Returns the merged `UnifiedEvent[]` for all connected, visible-by-default providers. Reads from Postgres cache (fetches from provider APIs if cache is stale).

**Query params**: none  
**Response**:
```json
{
  "events": [
    {
      "id": "google:abc123",
      "sourceProvider": "google",
      "sourceCalendarId": "primary",
      "title": "Team Standup",
      "startIso": "2026-04-16T09:00:00Z",
      "endIso": "2026-04-16T09:30:00Z",
      "allDay": false
    }
  ],
  "meta": {
    "windowStart": "2026-03-17",
    "windowEnd": "2026-07-15",
    "providers": [
      { "provider": "google", "fetchedAt": "2026-04-16T10:00:00Z", "stale": false },
      { "provider": "microsoft", "fetchedAt": "2026-04-16T10:00:00Z", "stale": false }
    ]
  }
}
```
**Errors**:
- `401` if session cookie is missing or invalid (no connected providers)
- `206 Partial Content` with `meta.providers[n].stale = true` if one provider's cache could not be refreshed (partial failure — return stale data + warning flag per FR-007)

---

## Session Route

### `GET /api/session`

Returns the current session state (which providers are connected).

**Response**:
```json
{
  "connections": [
    { "provider": "google", "email": "ian@gmail.com", "expiresAt": 1745000000 },
    { "provider": "microsoft", "email": "ian@work.com", "expiresAt": 1745000000 }
  ]
}
```
Returns `{ "connections": [] }` (not 401) if no providers are connected — the UI uses this to show the onboarding prompt.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_PASSWORD` | Yes | ≥32-char secret for `iron-session` cookie encryption |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth app client secret (server-only) |
| `GOOGLE_REDIRECT_URI` | Yes | e.g., `http://localhost:3000/api/auth/google/callback` |
| `MICROSOFT_CLIENT_ID` | Yes | Azure AD app client ID |
| `MICROSOFT_CLIENT_SECRET` | Yes | Azure AD app client secret (server-only) |
| `MICROSOFT_REDIRECT_URI` | Yes | e.g., `http://localhost:3000/api/auth/microsoft/callback` |
| `DATABASE_URL` | Yes | Postgres connection string, e.g., `postgres://postgres:postgres@localhost:5432/unified_calendar` |
