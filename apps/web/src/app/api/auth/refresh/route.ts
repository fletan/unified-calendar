import { logProviderError } from "@/lib/observability";
import { getSessionConnections, setSessionConnection } from "@/lib/session";
import type { Provider } from "@unified-calendar/domain";
import { google } from "googleapis";
import { NextResponse } from "next/server";

const REFRESH_THRESHOLD_SECONDS = 5 * 60;

export async function GET(): Promise<NextResponse> {
  const connections = await getSessionConnections();
  const now = Math.floor(Date.now() / 1000);
  const refreshed: Provider[] = [];

  for (const conn of connections) {
    if (conn.expiresAt > now + REFRESH_THRESHOLD_SECONDS) continue;

    if (conn.provider === "google") {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI,
        );
        oauth2Client.setCredentials({
          refresh_token: conn.refreshToken,
        });
        const { credentials } = await oauth2Client.refreshAccessToken();
        await setSessionConnection({
          ...conn,
          accessToken: credentials.access_token ?? conn.accessToken,
          expiresAt: credentials.expiry_date
            ? Math.floor(credentials.expiry_date / 1000)
            : now + 3600,
        });
        refreshed.push("google");
      } catch {
        logProviderError("google", "refresh_failed");
        return NextResponse.json(
          { provider: "google", reason: "refresh_failed" },
          { status: 401 },
        );
      }
    }
  }

  return NextResponse.json({ refreshed });
}
