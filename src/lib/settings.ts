import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { settings } from "./db/schema";

export type DayHours = { start: string; end: string }[];
export type WorkingHours = Record<string, DayHours>;

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  "0": [],
  "1": [],
  "2": [{ start: "09:30", end: "19:00" }],
  "3": [{ start: "09:30", end: "19:00" }],
  "4": [{ start: "09:30", end: "19:00" }],
  "5": [{ start: "09:30", end: "19:00" }],
  "6": [{ start: "09:30", end: "17:00" }],
};

export async function getSetting(key: string, fallback = "") {
  // `next build` prerenders `/_not-found` (and the root layout/footer) without
  // Coolify/runtime env. Reads must not require DATABASE_URL at build time.
  if (!process.env.DATABASE_URL) {
    return fallback;
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return rows[0]?.value ?? fallback;
}

export async function setSetting(key: string, value: string) {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function getAllSettings() {
  if (!process.env.DATABASE_URL) {
    return {} as Record<string, string>;
  }
  const db = getDb();
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((row) => [row.key, row.value])) as Record<
    string,
    string
  >;
}

export async function getWorkingHours(): Promise<WorkingHours> {
  const raw = await getSetting("working_hours", "");
  if (!raw) return DEFAULT_WORKING_HOURS;
  try {
    return JSON.parse(raw) as WorkingHours;
  } catch {
    return DEFAULT_WORKING_HOURS;
  }
}

export async function getStudioConfig() {
  const all = await getAllSettings();
  return {
    studioName: all.studio_name ?? "Desy Nails",
    studioFullName: all.studio_full_name ?? "Desiree Tropini Studio",
    tagline: all.tagline ?? "ogni dettaglio, la mia passione",
    instagram: all.instagram ?? "__desy.nails__",
    phone: all.phone ?? "",
    address: all.address ?? "",
    timezone: all.timezone ?? "Europe/Rome",
    slotInterval: Number(all.slot_interval ?? 30),
    bufferMinutes: Number(all.buffer_minutes ?? 0),
    calendarToken: all.calendar_token ?? "",
    caldavUrl: all.caldav_url ?? "",
    caldavUsername: all.caldav_username ?? "",
    caldavPassword: all.caldav_password ?? "",
    caldavCalendarUrl: all.caldav_calendar_url ?? "",
    workingHours: await getWorkingHours(),
  };
}
