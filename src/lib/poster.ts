import { and, gte, lt } from "drizzle-orm";
import { getBusyRanges } from "./availability";
import { getDb } from "./db";
import { blockedSlots } from "./db/schema";
import { getStudioConfig } from "./settings";
import { addMinutes, formatRomeDate, fromRomeLocal, overlaps, toRomeParts } from "./time";

export type PosterSlot = { time: string; taken: boolean };
export type PosterDay = {
  dateStr: string;
  dayNumber: string;
  weekday: string;
  closed: boolean;
  slots: PosterSlot[];
};
export type PosterWeek = { label: string; days: PosterDay[] };
export type PosterData = { subtitle: string; weeks: PosterWeek[]; instagram: string };

export const POSTER_WEEK_OPTIONS = [1, 2, 3];
export const POSTER_STEP_OPTIONS = [30, 60, 90, 120];

function minutesOf(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function timeOf(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function shiftDate(dateStr: string, days: number) {
  return toRomeParts(addMinutes(fromRomeLocal(dateStr, "12:00"), days * 24 * 60)).date;
}

/** Lunedì della settimana che contiene la data. */
export function mondayOf(dateStr: string) {
  const weekday = fromRomeLocal(dateStr, "12:00").getDay();
  return shiftDate(dateStr, -((weekday + 6) % 7));
}

function joinItalian(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

export async function buildPosterData(options: {
  from: string;
  weeks: number;
  stepMinutes: number;
  now?: Date;
}): Promise<PosterData> {
  const monday = mondayOf(options.from);
  const start = fromRomeLocal(monday, "00:00");
  const end = addMinutes(start, options.weeks * 7 * 24 * 60 + 120);
  const db = getDb();
  const [config, busy, blocks] = await Promise.all([
    getStudioConfig(),
    getBusyRanges(start, end),
    db
      .select()
      .from(blockedSlots)
      .where(and(lt(blockedSlots.startAt, end), gte(blockedSlots.endAt, start))),
  ]);
  const earliest = addMinutes(options.now ?? new Date(), config.minNoticeHours * 60);
  const months = new Set<string>();

  const weeks: PosterWeek[] = Array.from({ length: options.weeks }, (_, weekIndex) => {
    const weekMonths = new Set<string>();
    const days: PosterDay[] = [];

    for (let offset = 0; offset < 7; offset++) {
      const dateStr = shiftDate(monday, weekIndex * 7 + offset);
      const noon = fromRomeLocal(dateStr, "12:00");
      const windows = config.workingHours[String(noon.getDay())] ?? [];
      if (windows.length === 0) continue;

      const slots: PosterSlot[] = [];
      let blockedCount = 0;
      for (const window of windows) {
        const last = minutesOf(window.end) - options.stepMinutes;
        for (let cursor = minutesOf(window.start); cursor <= last; cursor += options.stepMinutes) {
          const time = timeOf(cursor);
          const slotStart = fromRomeLocal(dateStr, time);
          const slotEnd = addMinutes(slotStart, options.stepMinutes);
          const blocked = blocks.some((block) =>
            overlaps(slotStart, slotEnd, block.startAt, block.endAt),
          );
          if (blocked) blockedCount++;
          const taken =
            slotStart < earliest ||
            busy.some((range) => overlaps(slotStart, slotEnd, range.start, range.end));
          slots.push({ time, taken });
        }
      }
      if (slots.length === 0) continue;

      const month = formatRomeDate(noon, { month: "long" });
      weekMonths.add(month);
      months.add(month);
      days.push({
        dateStr,
        dayNumber: String(Number(dateStr.slice(8, 10))),
        weekday: formatRomeDate(noon, { weekday: "long" }),
        closed: blockedCount === slots.length,
        slots,
      });
    }

    return { label: [...weekMonths].join(" · "), days };
  }).filter((week) => week.days.length > 0);

  return {
    subtitle: `di ${joinItalian([...months])}`,
    weeks,
    instagram: config.instagram,
  };
}
