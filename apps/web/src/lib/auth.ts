import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const STATE_COOKIE = "oauth_state";
const STATE_TTL_SECONDS = 300;

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export async function setStateCookie(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_TTL_SECONDS,
    path: "/",
  });
}

export async function verifyStateCookie(state: string): Promise<boolean> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(STATE_COOKIE)?.value;
  if (!stored || stored !== state) return false;
  cookieStore.delete(STATE_COOKIE);
  return true;
}
