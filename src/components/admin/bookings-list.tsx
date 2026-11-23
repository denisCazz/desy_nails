"use client";

import { Mail, Pencil, Phone } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  BookingEditor,
} from "@/components/admin/booking-editor";
import type { Booking } from "@/lib/db/schema";
import { formatRomeDate, toRomeParts } from "@/lib/time";

type Filter = "upcoming" | "pending" | "past" | "cancelled" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "upcoming", label: "Prossimi" },
  { value: "pending", label: "Da confermare" },
  { value: "past", label: "Passati" },
  { value: "cancelled", label: "Annullati" },
  { value: "all", label: "Tutti" },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gold/25 text-ink",
  confirmed: "bg-emerald-200/60 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
  completed: "bg-line/50 text-muted",
  cancelled: "bg-rose-200/60 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100",
};

export function BookingsList({ bookings }: { bookings: Booking[] }) {
  const [rows, setRows] = useState(bookings);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Booking | null>(null);
  const [now] = useState(() => Date.now());

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        const future = row.endAt.getTime() >= now;
        if (filter === "upcoming") return future && row.status !== "cancelled";
        if (filter === "pending") return future && row.status === "pending";
        if (filter === "past") return !future && row.status !== "cancelled";
        if (filter === "cancelled") return row.status === "cancelled";
        return true;
      })
      .filter(
        (row) =>
          !q ||
          `${row.customerName} ${row.email} ${row.phone} ${row.serviceName}`
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) =>
        filter === "past"
          ? b.startAt.getTime() - a.startAt.getTime()
          : a.startAt.getTime() - b.startAt.getTime(),
      );
  }, [rows, filter, query, now]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Booking[]>();
    for (const row of visible) {
      const key = toRomeParts(row.startAt).date;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return [...groups.entries()];
  }, [visible]);

  async function quickStatus(booking: Booking, status: string) {
    const res = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRows((current) => current.map((row) => (row.id === booking.id ? { ...row, status } : row)));
    }
  }

  const time = (date: Date) => formatRomeDate(date, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-5">
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

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === item.value ? "border-gold bg-blush/50 text-mauve" : "border-line text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca nome, email, telefono…"
          className="ml-auto min-w-56 rounded-full border border-line bg-paper px-4 py-1.5 text-sm"
        />
      </div>

      {grouped.length === 0 ? <p className="text-muted">Nessun appuntamento.</p> : null}

      {grouped.map(([date, items]) => (
        <section key={date} className="break-inside-avoid">
          <h3 className="mb-2 font-serif text-lg capitalize text-mauve">
            {formatRomeDate(items[0].startAt, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h3>
          <div className="space-y-2">
            {items.map((booking) => (
              <article key={booking.id} className="gold-border flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-4">
                <div className="w-28 shrink-0 font-serif text-xl text-gold">
                  {time(booking.startAt)}
                  <span className="block text-xs font-sans text-muted">fino alle {time(booking.endAt)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{booking.customerName}</p>
                  <p className="text-sm text-mauve">
                    {booking.serviceName}
                    {booking.extras.length > 0 ? ` + ${booking.extras.map((extra) => extra.name).join(", ")}` : ""}
                  </p>
                  <p className="flex flex-wrap gap-x-4 text-xs text-muted">
                    <a href={`mailto:${booking.email}`} className="inline-flex items-center gap-1 hover:text-mauve">
                      <Mail className="size-3" /> {booking.email}
                    </a>
                    {booking.phone ? (
                      <a href={`tel:${booking.phone}`} className="inline-flex items-center gap-1 hover:text-mauve">
                        <Phone className="size-3" /> {booking.phone}
                      </a>
                    ) : null}
                  </p>
                  {booking.notes ? <p className="mt-1 text-xs text-muted">Note: {booking.notes}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[booking.status] ?? ""}`}>
                    {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                  </span>
                  {booking.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => quickStatus(booking, "confirmed")}
                      className="rounded-full border border-gold px-3 py-1 text-xs print:hidden"
                    >
                      Conferma
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setEditing(booking)}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs print:hidden"
                  >
                    <Pencil className="size-3" /> Modifica
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
