import { and, eq, gte, lt, ne } from "drizzle-orm";
import { getDb } from "./db";
import { blockedSlots, bookings, type Service } from "./db/schema";
import { getStudioConfig, type WorkingHours } from "./settings";
import { addMinutes, fromRomeLocal, overlaps, toRomeParts } from "./time";

function minutesOf(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function timeFromMinutes(total: number) {
  const hour = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const minute = (total % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

export async function getBusyRanges(from: Date, to: Date) {
  const db = getDb();
  const [busyBookings, busyBlocks] = await Promise.all([
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

  return [
    ...busyBookings.map((row) => ({ start: row.startAt, end: row.endAt })),
    ...busyBlocks.map((row) => ({ start: row.startAt, end: row.endAt })),
  ];
}

export function slotsForDay(options: {
  dateStr: string;
  durationMinutes: number;
  interval: number;
  bufferMinutes: number;
  workingHours: WorkingHours;
  busy: { start: Date; end: Date }[];
  now?: Date;
}) {
  const weekday = fromRomeLocal(options.dateStr, "12:00").getDay();
  const windows = options.workingHours[String(weekday)] ?? [];
  const now = options.now ?? new Date();
  const slots: string[] = [];

  for (const window of windows) {
    const startMin = minutesOf(window.start);
    const endMin = minutesOf(window.end);
    for (
      let cursor = startMin;
      cursor + options.durationMinutes <= endMin;
      cursor += options.interval
    ) {
      const time = timeFromMinutes(cursor);
      const start = fromRomeLocal(options.dateStr, time);
      const end = addMinutes(
        start,
        options.durationMinutes + options.bufferMinutes,
      );
      if (start <= now) continue;
      const taken = options.busy.some((range) =>
        overlaps(start, end, range.start, range.end),
      );
      if (!taken) slots.push(time);
    }
  }

  return slots;
}

export async function getAvailability(service: Service, days = 28) {
  const config = await getStudioConfig();
  const todayParts = toRomeParts(new Date());
  const start = fromRomeLocal(todayParts.date, "00:00");
  const end = addMinutes(start, days * 24 * 60);
  const busy = await getBusyRanges(start, end);
  const result: { date: string; slots: string[] }[] = [];

  for (let i = 0; i < days; i++) {
    const day = addMinutes(start, i * 24 * 60);
    const dateStr = toRomeParts(day).date;
    const slots = slotsForDay({
      dateStr,
      durationMinutes: service.durationMinutes,
      interval: config.slotInterval,
      bufferMinutes: config.bufferMinutes,
      workingHours: config.workingHours,
      busy,
    });
    if (slots.length > 0) {
      result.push({ date: dateStr, slots });
    }
  }

  return result;
}

export async function isSlotFree(
  start: Date,
  end: Date,
  ignoreBookingId?: string,
) {
  const busy = await getBusyRanges(start, end);
  const db = getDb();
  if (ignoreBookingId) {
    const ignored = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, ignoreBookingId));
    const skip = ignored[0];
    return !busy.some(
      (range) =>
        !(skip && range.start.getTime() === skip.startAt.getTime()) &&
        overlaps(start, end, range.start, range.end),
    );
  }
  return !busy.some((range) => overlaps(start, end, range.start, range.end));
}
