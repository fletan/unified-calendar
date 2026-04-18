import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { verifyStateCookie } from "@/lib/auth";
import { setSessionConnection } from "@/lib/session";
import { logAuthEvent } from "@/lib/observability";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!state || !(await verifyStateCookie(state))) {
    logAuthEvent("google", "failure", "state_mismatch");
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  if (!code) {
    logAuthEvent("google", "failure", "missing_code");
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? "";

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    await setSessionConnection({
      provider: "google",
      userId: userInfo.id ?? "",
      email: userInfo.email ?? "",
      accessToken: tokens.access_token ?? "",
      refreshToken: tokens.refresh_token ?? "",
      expiresAt: tokens.expiry_date
        ? Math.floor(tokens.expiry_date / 1000)
        : Math.floor(Date.now() / 1000) + 3600,
    });

    logAuthEvent("google", "success");
    return NextResponse.redirect(new URL("/", req.url));
  } catch {
    logAuthEvent("google", "failure", "token_exchange_failed");
    return NextResponse.json({ error: "Provider unreachable" }, { status: 502 });
  }
}
