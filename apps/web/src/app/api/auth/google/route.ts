import { google } from "googleapis";
import { NextResponse } from "next/server";
import { generateState, setStateCookie } from "@/lib/auth";
import { logAuthEvent } from "@/lib/observability";

export async function GET(): Promise<NextResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    logAuthEvent("google", "failure", "missing_env");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  const state = generateState();
  await setStateCookie(state);

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.readonly", "openid", "profile", "email"],
    state,
  });

  return NextResponse.redirect(url);
}
