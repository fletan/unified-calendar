# @unified-calendar/workspace

Simple-first monorepo scaffold for the Unified Calendar project.

## Layout

- apps/web: Next.js app (UI + initial API routes)
- packages/domain: provider-agnostic models and normalization contracts
- packages/providers-google: Google adapter
- packages/providers-microsoft: Microsoft adapter
- packages/ui: shared components
- packages/test-utils: shared test helpers
- packages/config-typescript: shared TypeScript config
- infra/docker: local infrastructure definitions
- infra/scripts: local automation

## Quick Start

1. corepack enable
2. pnpm install
3. Copy `apps/web/.env.local.example` to `apps/web/.env.local` and fill in the values (see [Obtaining OAuth credentials](#obtaining-oauth-credentials) below)
4. `docker compose -f infra/docker/docker-compose.yml up -d`
5. pnpm dev
6. pnpm test

## Obtaining OAuth credentials

### Google (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project (or select an existing one).
2. Navigate to **APIs & Services → Library** and enable the **Google Calendar API**.
3. Navigate to **APIs & Services → OAuth consent screen**, choose **External**, and fill in the required fields. Then open the **Data Access** tab and add `https://www.googleapis.com/auth/calendar.readonly` as a scope.
4. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
5. Choose **Web application**, then add `http://localhost:3000/api/auth/google/callback` as an **Authorized redirect URI**.
6. Copy the generated **Client ID** and **Client secret** into your `.env.local`.

### Microsoft (`MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`)

1. Go to the [Azure portal](https://portal.azure.com/) and open **Microsoft Entra ID → App registrations → New registration**.
2. Set a name, choose **Accounts in any organizational directory and personal Microsoft accounts**, and add `http://localhost:3000/api/auth/microsoft/callback` as a **Redirect URI** (platform: **Web**).
3. After creation, copy the **Application (client) ID** — this is your `MICROSOFT_CLIENT_ID`.
4. Navigate to **Certificates & secrets → New client secret**, add a description, choose an expiry, and click **Add**.
5. Copy the secret **Value** (shown only once) into `MICROSOFT_CLIENT_SECRET`.
6. Navigate to **API permissions → Add a permission → Microsoft Graph → Delegated permissions** and add `Calendars.Read`.
