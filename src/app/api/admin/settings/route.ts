import { NextResponse } from "next/server";
import { z } from "zod";
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

const LABELS: Partial<Record<(typeof allowed)[number], string>> = {
  min_notice_hours: "Preavviso minimo",
  buffer_minutes: "Pausa tra appuntamenti",
};

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const workingHoursSchema = z.record(
  z.enum(["0", "1", "2", "3", "4", "5", "6"]),
  z
    .array(z.object({ start: time, end: time }).refine((w) => w.start < w.end))
    .max(6)
    .refine((windows) => {
      const sorted = [...windows].sort((a, b) => a.start.localeCompare(b.start));
      return sorted.every((w, i) => i === 0 || w.start >= sorted[i - 1].end);
    }),
);

export async function POST(request: Request) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const body = (await request.json()) as Record<string, string>;
  const keys = allowed.filter((key) => key in body);
  if (keys.includes("working_hours")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body.working_hours);
    } catch {
      parsed = null;
    }
    if (!workingHoursSchema.safeParse(parsed).success) {
      return NextResponse.json({ error: "Orari di lavoro non validi." }, { status: 400 });
    }
  }
  for (const key of keys) {
    const range = numeric[key];
    if (!range) continue;
    const value = Number(body[key]);
    if (!Number.isInteger(value) || value < range[0] || value > range[1]) {
      return NextResponse.json(
        { error: `${LABELS[key] ?? key}: valore non valido (da ${range[0]} a ${range[1]}).` },
        { status: 400 },
      );
    }
  }
  for (const key of keys) {
    await setSetting(key, String(body[key] ?? ""));
  }
  return NextResponse.json({ ok: true });
}
