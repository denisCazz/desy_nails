import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getClientIp, rateLimit } from "@/lib/anti-spam";
import {
  ADMIN_COOKIE,
  checkAdminPassword,
  createAdminToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!rateLimit(`login:${getClientIp(request)}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Troppi tentativi. Riprova tra 15 minuti." },
      { status: 429 },
    );
  }
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  if (!checkAdminPassword(body.password ?? "")) {
    return NextResponse.json({ error: "Password non corretta" }, { status: 401 });
  }

  const token = await createAdminToken();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json({ ok: true });
}
