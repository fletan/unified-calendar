import { generateState, setStateCookie } from "@/lib/auth";
import { logAuthEvent } from "@/lib/observability";
import {
  ConfidentialClientApplication,
  type Configuration,
} from "@azure/msal-node";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    logAuthEvent("microsoft", "failure", "missing_env");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  const config: Configuration = {
    auth: {
      clientId,
      clientSecret,
      authority: "https://login.microsoftonline.com/common",
    },
  };

  const msalApp = new ConfidentialClientApplication(config);

  const state = generateState();
  await setStateCookie(state);

  const url = await msalApp.getAuthCodeUrl({
    scopes: ["Calendars.Read", "offline_access", "openid", "profile", "email"],
    redirectUri,
    state,
  });

  return NextResponse.redirect(url);
}
