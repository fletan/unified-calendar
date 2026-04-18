import { ConfidentialClientApplication } from "@azure/msal-node";
import type { Configuration } from "@azure/msal-node";
import { NextRequest, NextResponse } from "next/server";
import { verifyStateCookie } from "@/lib/auth";
import { setSessionConnection } from "@/lib/session";
import { logAuthEvent } from "@/lib/observability";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!state || !(await verifyStateCookie(state))) {
    logAuthEvent("microsoft", "failure", "state_mismatch");
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  if (!code) {
    logAuthEvent("microsoft", "failure", "missing_code");
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID ?? "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET ?? "";
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI ?? "";

  const config: Configuration = {
    auth: {
      clientId,
      clientSecret,
      authority: "https://login.microsoftonline.com/common",
    },
  };

  const msalApp = new ConfidentialClientApplication(config);

  try {
    const result = await msalApp.acquireTokenByCode({
      code,
      scopes: ["Calendars.Read", "offline_access", "openid", "profile", "email"],
      redirectUri,
    });

    if (!result) {
      throw new Error("No result from MSAL");
    }

    const claims = result.idTokenClaims as Record<string, unknown> | undefined;
    const email =
      result.account?.username ?? (claims?.email as string | undefined) ?? "";
    const userId = result.account?.localAccountId ?? result.uniqueId ?? "";

    await setSessionConnection({
      provider: "microsoft",
      userId,
      email: String(email),
      accessToken: result.accessToken,
      refreshToken: "",
      expiresAt: result.expiresOn
        ? Math.floor(result.expiresOn.getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 3600,
    });

    logAuthEvent("microsoft", "success");
    return NextResponse.redirect(new URL("/", req.url));
  } catch {
    logAuthEvent("microsoft", "failure", "token_exchange_failed");
    return NextResponse.json({ error: "Provider unreachable" }, { status: 502 });
  }
}
