import { NextResponse } from "next/server";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { setSetting } from "@/lib/settings";

const allowed = [
  "phone",
  "address",
  "instagram",
  "caldav_url",
  "caldav_username",
  "caldav_password",
  "caldav_calendar_url",
  "working_hours",
] as const;

export async function POST(request: Request) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const body = (await request.json()) as Record<string, string>;
  for (const key of allowed) {
    if (key in body) await setSetting(key, body[key] ?? "");
  }
  return NextResponse.json({ ok: true });
}
