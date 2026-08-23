import { and, gte, lt, ne } from "drizzle-orm";
import { getDb } from "./db";
import { blockedSlots, bookings } from "./db/schema";
import { toRomeParts } from "./time";

function icsDate(date: Date) {
  const parts = toRomeParts(date);
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}00`;
}

function stamp(date = new Date()) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function fold(line: string) {
  const chunks: string[] = [];
  for (let i = 0; i < line.length; i += 74) {
    chunks.push((i === 0 ? "" : " ") + line.slice(i, i + 74));
  }
  return chunks.join("\r\n");
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export async function buildStudioCalendar(from: Date, to: Date) {
  const db = getDb();
  const [rows, blocks] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(
        and(
          ne(bookings.status, "cancelled"),
          lt(bookings.startAt, to),
          gte(bookings.endAt, from),
        ),
      ),
    db
      .select()
      .from(blockedSlots)
      .where(and(lt(blockedSlots.startAt, to), gte(blockedSlots.endAt, from))),
  ]);

  const events = [
    ...rows.map((booking) => {
      const extras =
        booking.extras
          ?.map((extra) => extra.name)
          .filter(Boolean)
          .join(", ") ?? "";
      return [
        "BEGIN:VEVENT",
        fold(`UID:${booking.icalUid ?? `desy-booking-${booking.id}@desynails`}`),
        `DTSTAMP:${stamp(booking.createdAt)}`,
        `DTSTART;TZID=Europe/Rome:${icsDate(booking.startAt)}`,
        `DTEND;TZID=Europe/Rome:${icsDate(booking.endAt)}`,
        fold(`SUMMARY:${escapeText(`${booking.serviceName} — ${booking.customerName}`)}`),
        fold(
          `DESCRIPTION:${escapeText(
            `${booking.customerName}\\n${booking.email}${booking.phone ? `\\n${booking.phone}` : ""}${extras ? `\\nExtra: ${extras}` : ""}${booking.notes ? `\\n${booking.notes}` : ""}`,
          )}`,
        ),
        "STATUS:CONFIRMED",
        "END:VEVENT",
      ].join("\r\n");
    }),
    ...blocks.map((block) =>
      [
        "BEGIN:VEVENT",
        fold(`UID:${block.icalUid ?? `desy-block-${block.id}@desynails`}`),
        `DTSTAMP:${stamp(block.createdAt)}`,
        `DTSTART;TZID=Europe/Rome:${icsDate(block.startAt)}`,
        `DTEND;TZID=Europe/Rome:${icsDate(block.endAt)}`,
        fold(`SUMMARY:${escapeText(block.title)}`),
        "TRANSP:OPAQUE",
        "END:VEVENT",
      ].join("\r\n"),
    ),
  ];

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Desy Nails//Agenda//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Desy Nails",
    "X-WR-TIMEZONE:Europe/Rome",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Rome",
    "X-LIC-LOCATION:Europe/Rome",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function bookingIcs(options: {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  description: string;
}) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Desy Nails//Booking//IT",
    "BEGIN:VEVENT",
    `UID:desy-booking-${options.id}@desynails`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;TZID=Europe/Rome:${icsDate(options.startAt)}`,
    `DTEND;TZID=Europe/Rome:${icsDate(options.endAt)}`,
    `SUMMARY:${options.title}`,
    `DESCRIPTION:${options.description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
