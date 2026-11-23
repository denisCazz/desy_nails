"use client";

import { addDays, format, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { useMemo, useState } from "react";
import { BookingEditor } from "@/components/admin/booking-editor";
import type { BlockedSlot, Booking } from "@/lib/db/schema";
import { formatRomeDate } from "@/lib/time";

type Props = {
  bookings: Booking[];
  blocks: BlockedSlot[];
  calendarUrl: string;
};

export function AgendaBoard({ bookings, blocks, calendarUrl }: Props) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [rows, setRows] = useState(bookings);
  const [blocked, setBlocked] = useState(blocks);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Booking | null>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  function eventsForDay(day: Date) {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    return {
      bookings: rows.filter(
        (row) => row.status !== "cancelled" && row.startAt < end && row.endAt > start,
      ),
      blocks: blocked.filter((row) => row.startAt < end && row.endAt > start),
    };
  }

  async function addBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(form.get("title") ?? "Non disponibile"),
        date: String(form.get("date") ?? ""),
        start: String(form.get("start") ?? ""),
        end: String(form.get("end") ?? ""),
      }),
    });
    const data = (await res.json()) as { block?: BlockedSlot; error?: string };
    if (data.block) {
      setBlocked((current) => [...current, data.block!]);
      event.currentTarget.reset();
    } else {
      setMessage(data.error ?? "Blocco non creato.");
    }
  }

  async function updateBooking(id: string, status: string) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, status } : row)),
      );
    }
  }

  async function syncCalDav() {
    const res = await fetch("/api/admin/calendar/sync", { method: "POST" });
    const data = (await res.json()) as { error?: string; imported?: number };
    if (!res.ok) setMessage(data.error ?? "Sincronizzazione non riuscita.");
    else {
      setMessage(`Importati ${data.imported ?? 0} eventi da iCal.`);
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      {editing ? (
        <BookingEditor
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setRows((current) => current.map((row) => (row.id === saved.id ? saved : row)));
            setEditing(null);
          }}
          onDeleted={(id) => {
            setRows((current) => current.filter((row) => row.id !== id));
            setEditing(null);
          }}
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            ←
          </button>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            Oggi
          </button>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            →
          </button>
        </div>
        <p className="font-serif text-xl text-mauve">
          {format(weekStart, "d MMM", { locale: it })} –{" "}
          {format(addDays(weekStart, 6), "d MMM yyyy", { locale: it })}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const events = eventsForDay(day);
          return (
            <section key={day.toISOString()} className="gold-border min-h-56 rounded-2xl bg-surface p-3">
              <h3 className="text-sm font-medium capitalize text-mauve">
                {format(day, "EEE d", { locale: it })}
              </h3>
              <div className="mt-2 space-y-2">
                {events.bookings.map((booking) => (
                  <article key={booking.id} className="rounded-xl bg-blush/40 p-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditing(booking)}
                      className="block w-full text-left hover:underline"
                      title="Modifica appuntamento"
                    >
                      <span className="block font-medium">
                        {formatRomeDate(new Date(booking.startAt), {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        –
                        {formatRomeDate(new Date(booking.endAt), {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {booking.serviceName}
                      </span>
                      <span className="block">{booking.customerName}</span>
                    </button>
                    <select
                      value={booking.status}
                      className="mt-1 w-full rounded border border-line bg-paper"
                      onChange={(event) => updateBooking(booking.id, event.target.value)}
                    >
                      <option value="pending">In attesa</option>
                      <option value="confirmed">Confermata</option>
                      <option value="completed">Completata</option>
                      <option value="cancelled">Annullata</option>
                    </select>
                  </article>
                ))}
                {events.blocks.map((block) => (
                  <article key={block.id} className="rounded-xl bg-line/40 p-2 text-xs">
                    <p className="font-medium">{block.title}</p>
                    <p>
                      {formatRomeDate(new Date(block.startAt), {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={addBlock} className="gold-border space-y-3 rounded-2xl bg-surface p-5">
          <h3 className="font-serif text-xl text-mauve">Blocca uno slot</h3>
          <input name="title" placeholder="Titolo" className="w-full rounded-xl border border-line bg-paper px-3 py-2" />
          <input required type="date" name="date" className="w-full rounded-xl border border-line bg-paper px-3 py-2" />
          <div className="grid grid-cols-2 gap-2">
            <input required type="time" name="start" className="rounded-xl border border-line bg-paper px-3 py-2" />
            <input required type="time" name="end" className="rounded-xl border border-line bg-paper px-3 py-2" />
          </div>
          <button className="rounded-full bg-gold px-4 py-2 text-[#3a2c2e]">Aggiungi blocco</button>
        </form>

        <div className="gold-border space-y-3 rounded-2xl bg-surface p-5">
          <h3 className="font-serif text-xl text-mauve">iPhone / iCal</h3>
          <p className="text-sm text-muted">
            Su iPhone: Impostazioni → App → Calendario → Account → Aggiungi account → Altro →
            Aggiungi calendario in abbonamento, e incolla questo URL. Gli appuntamenti del sito
            appariranno in Calendar. Per far sì che gli eventi creati sul telefono blocchino gli
            slot sul sito, configura CalDAV nelle impostazioni e premi sincronizza.
          </p>
          <input readOnly value={calendarUrl} className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs" />
          <div className="flex flex-wrap gap-2">
            <a
              href={calendarUrl.replace(/^https?:/, "webcal:")}
              className="rounded-full border border-gold px-4 py-2 text-sm"
            >
              Apri in Calendar
            </a>
            <button
              type="button"
              onClick={syncCalDav}
              className="rounded-full border border-line px-4 py-2 text-sm"
            >
              Sincronizza CalDAV
            </button>
          </div>
          {message ? <p className="text-sm text-mauve">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
