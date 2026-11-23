import { and, asc, gte, lt, ne } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { INSTAGRAM_GRADIENT, InstagramIcon } from "@/components/icons/instagram-icon";
import { PrintButton } from "@/components/admin/print-button";
import { freeWindowsForDay, getBusyRanges } from "@/lib/availability";
import { getDb } from "@/lib/db";
import { blockedSlots, bookings } from "@/lib/db/schema";
import { getStudioConfig } from "@/lib/settings";
import { addMinutes, formatRomeDate, fromRomeLocal, toRomeParts } from "@/lib/time";

export const dynamic = "force-dynamic";

const DAY_OPTIONS = [7, 14, 21, 28];

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAvailabilityPage({
  searchParams,
}: PageProps<"/admin/disponibilita">) {
  const params = await searchParams;
  const today = toRomeParts(new Date()).date;
  const fromParam = pick(params.dal) ?? "";
  const fromDate = /^\d{4}-\d{2}-\d{2}$/.test(fromParam) ? fromParam : today;
  const days = DAY_OPTIONS.includes(Number(pick(params.giorni))) ? Number(pick(params.giorni)) : 14;
  const showBookings = pick(params.appuntamenti) === "1";

  const start = fromRomeLocal(fromDate, "00:00");
  const end = addMinutes(start, days * 24 * 60 + 120);
  const db = getDb();
  const [config, busy, bookingRows, blockRows] = await Promise.all([
    getStudioConfig(),
    getBusyRanges(start, end),
    db
      .select()
      .from(bookings)
      .where(and(ne(bookings.status, "cancelled"), lt(bookings.startAt, end), gte(bookings.endAt, start)))
      .orderBy(asc(bookings.startAt)),
    db
      .select()
      .from(blockedSlots)
      .where(and(lt(blockedSlots.startAt, end), gte(blockedSlots.endAt, start)))
      .orderBy(asc(blockedSlots.startAt)),
  ]);

  const now = new Date();
  const halfHourMs = 30 * 60_000;
  const nextHalfHour = new Date(Math.ceil(now.getTime() / halfHourMs) * halfHourMs);
  const time = (date: Date) => formatRomeDate(date, { hour: "2-digit", minute: "2-digit" });

  const sheet = Array.from({ length: days }, (_, index) => {
    const dateStr = toRomeParts(addMinutes(fromRomeLocal(fromDate, "12:00"), index * 24 * 60)).date;
    const weekday = fromRomeLocal(dateStr, "12:00").getDay();
    const open = (config.workingHours[String(weekday)] ?? []).length > 0;
    const windows = freeWindowsForDay({
      dateStr,
      workingHours: config.workingHours,
      busy: [...busy, { start: addMinutes(now, -365 * 24 * 60), end: nextHalfHour }],
      minMinutes: 30,
    });
    const sameDay = (date: Date) => toRomeParts(date).date === dateStr;
    return {
      dateStr,
      open,
      windows,
      bookings: bookingRows.filter((row) => sameDay(row.startAt)),
      blocks: blockRows.filter((row) => sameDay(row.startAt)),
    };
  });

  const lastDate = sheet[sheet.length - 1]?.dateStr ?? fromDate;
  const longDate = (dateStr: string) =>
    formatRomeDate(fromRomeLocal(dateStr, "12:00"), { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="font-serif text-3xl text-mauve">Disponibilità</h2>
        <PrintButton label="Stampa disponibilità" />
      </div>

      <Link
        href={`/admin/disponibilita/locandina?dal=${fromDate}`}
        className={`${INSTAGRAM_GRADIENT} group mb-6 flex items-center gap-4 rounded-2xl p-4 text-white shadow-lg shadow-[#dd2a7b]/20 transition hover:shadow-xl hover:shadow-[#dd2a7b]/30 sm:p-5 print:hidden`}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/40 sm:size-14">
          <InstagramIcon className="size-7 sm:size-8" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold leading-tight sm:text-xl">
            Crea la locandina per Instagram
          </span>
          <span className="block text-sm text-white/85">
            Storia 1080×1920 con gli orari liberi e quelli già prenotati, in PNG o PDF
          </span>
        </span>
        <ArrowRight className="size-6 shrink-0 transition group-hover:translate-x-1" aria-hidden="true" />
      </Link>

      <form className="gold-border mb-8 flex flex-wrap items-end gap-3 rounded-2xl bg-surface p-4 text-sm print:hidden">
        <label>
          Dal
          <input type="date" name="dal" defaultValue={fromDate} className="block rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <label>
          Periodo
          <select name="giorni" defaultValue={String(days)} className="block rounded-xl border border-line bg-paper px-3 py-2">
            {DAY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option / 7 === 1 ? "1 settimana" : `${option / 7} settimane`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2">
          <input type="checkbox" name="appuntamenti" value="1" defaultChecked={showBookings} />
          Includi appuntamenti (uso interno)
        </label>
        <button className="rounded-full border border-gold px-4 py-2">Aggiorna</button>
      </form>

      <div className="print-sheet">
        <header className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{config.studioName}</p>
          <h3 className="font-serif text-2xl text-mauve">
            {showBookings ? "Agenda e disponibilità" : "Disponibilità"}
          </h3>
          <p className="text-sm text-muted">
            dal {longDate(fromDate)} al {longDate(lastDate)}
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
          {sheet.map((day) => (
            <section key={day.dateStr} className="gold-border break-inside-avoid rounded-2xl bg-surface p-4">
              <h4 className="font-medium capitalize text-mauve">
                {formatRomeDate(fromRomeLocal(day.dateStr, "12:00"), { weekday: "long", day: "numeric", month: "long" })}
              </h4>
              {!day.open ? (
                <p className="mt-1 text-sm text-muted">Chiuso</p>
              ) : day.windows.length === 0 ? (
                <p className="mt-1 text-sm text-muted">Completo</p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {day.windows.map((window) => (
                    <li key={window.start} className="rounded-full border border-gold px-3 py-0.5 text-sm">
                      {window.start}–{window.end}
                    </li>
                  ))}
                </ul>
              )}
              {showBookings && (day.bookings.length > 0 || day.blocks.length > 0) ? (
                <ul className="mt-3 space-y-1 border-t border-line pt-2 text-xs">
                  {day.bookings.map((booking) => (
                    <li key={booking.id}>
                      <strong>
                        {time(booking.startAt)}–{time(booking.endAt)}
                      </strong>{" "}
                      {booking.customerName} · {booking.serviceName}
                      {booking.phone ? ` · ${booking.phone}` : ""}
                      {booking.status === "pending" ? " (da confermare)" : ""}
                    </li>
                  ))}
                  {day.blocks.map((block) => (
                    <li key={block.id} className="text-muted">
                      <strong>
                        {time(block.startAt)}–{time(block.endAt)}
                      </strong>{" "}
                      {block.title}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
