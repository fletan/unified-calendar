import { removeSessionConnection } from "@/lib/session";
import { isProvider } from "@unified-calendar/domain";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let provider: unknown;
  try {
    ({ provider } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof provider !== "string" || !isProvider(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  await removeSessionConnection(provider);
  return NextResponse.json({ ok: true });
}
