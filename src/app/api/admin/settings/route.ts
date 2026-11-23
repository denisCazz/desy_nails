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
  "min_notice_hours",
  "buffer_minutes",
] as const;

const numeric: Partial<Record<(typeof allowed)[number], [number, number]>> = {
  min_notice_hours: [0, 24 * 14],
  buffer_minutes: [0, 120],
};

export async function POST(request: Request) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const body = (await request.json()) as Record<string, string>;
  const keys = allowed.filter((key) => key in body);
  for (const key of keys) {
    const range = numeric[key];
    if (!range) continue;
    const value = Number(body[key]);
    if (!Number.isInteger(value) || value < range[0] || value > range[1]) {
      return NextResponse.json({ error: `Valore non valido: ${key}` }, { status: 400 });
    }
  }
  for (const key of keys) {
    await setSetting(key, String(body[key] ?? ""));
  }
  return NextResponse.json({ ok: true });
}
