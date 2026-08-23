import { eq } from "drizzle-orm";
import { createDAVClient } from "tsdav";
import { getDb } from "./db";
import { blockedSlots, bookings } from "./db/schema";
import { getStudioConfig } from "./settings";
import { slugId } from "./format";

function parseIcsDates(ics: string) {
  const startMatch = ics.match(/DTSTART(?:;[^:]*)?:([0-9T]+Z?)/);
  const endMatch = ics.match(/DTEND(?:;[^:]*)?:([0-9T]+Z?)/);
  const uidMatch = ics.match(/UID:([^\r\n]+)/);
  const summaryMatch = ics.match(/SUMMARY:([^\r\n]+)/);
  if (!startMatch || !endMatch) return null;

  const parse = (value: string) => {
    if (value.endsWith("Z")) {
      const compact = value.replace(/[-:]/g, "");
      return new Date(
        `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(9, 11)}:${compact.slice(11, 13)}:${compact.slice(13, 15) || "00"}Z`,
      );
    }
    const compact = value.replace(/[-:]/g, "");
    const local = `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(9, 11)}:${compact.slice(11, 13)}:00`;
    return new Date(local);
  };

  return {
    uid: uidMatch?.[1]?.trim() ?? slugId(),
    title: (summaryMatch?.[1] ?? "iPhone / iCal").replace(/\\,/g, ","),
    start: parse(startMatch[1]),
    end: parse(endMatch[1]),
  };
}

export async function syncFromCalDav() {
  const config = await getStudioConfig();
  if (!config.caldavUrl || !config.caldavUsername || !config.caldavPassword) {
    throw new Error("CalDAV non configurato");
  }

  const client = await createDAVClient({
    serverUrl: config.caldavUrl,
    credentials: {
      username: config.caldavUsername,
      password: config.caldavPassword,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  const calendars = await client.fetchCalendars();
  const calendar = config.caldavCalendarUrl
    ? calendars.find((item) => item.url === config.caldavCalendarUrl)
    : calendars[0];

  if (!calendar) throw new Error("Calendario CalDAV non trovato");

  const objects = await client.fetchCalendarObjects({ calendar });
  const db = getDb();
  let imported = 0;

  for (const object of objects) {
    const parsed = parseIcsDates(object.data ?? "");
    if (!parsed) continue;
    if (parsed.uid.startsWith("desy-booking-") || parsed.uid.startsWith("desy-block-")) {
      continue;
    }

    const existing = await db
      .select()
      .from(blockedSlots)
      .where(eq(blockedSlots.icalUid, parsed.uid))
      .limit(1);

    if (existing[0]) {
      await db
        .update(blockedSlots)
        .set({
          title: parsed.title,
          startAt: parsed.start,
          endAt: parsed.end,
        })
        .where(eq(blockedSlots.id, existing[0].id));
    } else {
      await db.insert(blockedSlots).values({
        id: slugId(),
        title: parsed.title,
        startAt: parsed.start,
        endAt: parsed.end,
        source: "ical",
        icalUid: parsed.uid,
      });
    }
    imported += 1;
  }

  return { imported, calendarUrl: calendar.url, calendars: calendars.map((c) => c.url) };
}

export async function pushBookingToCalDav(bookingId: string) {
  const config = await getStudioConfig();
  if (!config.caldavUrl || !config.caldavUsername || !config.caldavPassword) {
    return { pushed: false };
  }

  const db = getDb();
  const rows = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  const booking = rows[0];
  if (!booking) return { pushed: false };

  const client = await createDAVClient({
    serverUrl: config.caldavUrl,
    credentials: {
      username: config.caldavUsername,
      password: config.caldavPassword,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  const calendars = await client.fetchCalendars();
  const calendar = config.caldavCalendarUrl
    ? calendars.find((item) => item.url === config.caldavCalendarUrl)
    : calendars[0];
  if (!calendar) return { pushed: false };

  const uid = booking.icalUid ?? `desy-booking-${booking.id}@desynails`;
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (date: Date) =>
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Desy Nails//Agenda//IT",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(booking.startAt)}`,
    `DTEND:${fmt(booking.endAt)}`,
    `SUMMARY:${booking.serviceName} — ${booking.customerName}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  await client.createCalendarObject({
    calendar,
    filename: `${uid}.ics`,
    iCalString: ics,
  });

  return { pushed: true };
}
