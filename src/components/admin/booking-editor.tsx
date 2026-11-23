"use client";

import { useState } from "react";
import { AdminDialog } from "@/components/admin/admin-dialog";
import type { Booking } from "@/lib/db/schema";
import { toRomeParts } from "@/lib/time";

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermata",
  completed: "Completata",
  cancelled: "Annullata",
};

/** Le date arrivano come stringhe dalle risposte JSON. */
export function reviveBooking(raw: Booking): Booking {
  return {
    ...raw,
    startAt: new Date(raw.startAt),
    endAt: new Date(raw.endAt),
    createdAt: new Date(raw.createdAt),
  };
}

export function splitName(booking: Booking) {
  if (booking.firstName || booking.lastName) {
    return { firstName: booking.firstName, lastName: booking.lastName };
  }
  const [firstName = "", ...rest] = booking.customerName.split(" ");
  return { firstName, lastName: rest.join(" ") };
}

function shiftTime(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(Math.max(h * 60 + m + minutes, 0), 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function durationMinutes(start: string, end: string) {
  const toMin = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  return toMin(end) - toMin(start);
}

const field = "w-full rounded-xl border border-line bg-paper px-3 py-2";

export function BookingEditor({
  booking,
  onClose,
  onSaved,
  onDeleted,
}: {
  booking: Booking;
  onClose: () => void;
  onSaved: (booking: Booking) => void;
  onDeleted: (id: string) => void;
}) {
  const names = splitName(booking);
  const start = toRomeParts(booking.startAt);
  const end = toRomeParts(booking.endAt);
  const [form, setForm] = useState({
    firstName: names.firstName,
    lastName: names.lastName,
    email: booking.email,
    phone: booking.phone,
    serviceName: booking.serviceName,
    date: start.date,
    start: start.time,
    end: end.time,
    status: booking.status,
    notes: booking.notes,
  });
  const [notify, setNotify] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const minutes = durationMinutes(form.start, form.end);
  const timesChanged =
    form.date !== start.date || form.start !== start.time || form.end !== end.time;

  async function save(force = false) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, force, notify: notify && Boolean(form.email) }),
      });
      const data = (await res.json()) as {
        booking?: Booking;
        error?: string;
        conflict?: boolean;
        notified?: boolean;
      };
      if (!res.ok || !data.booking) {
        setConflict(Boolean(data.conflict));
        setError(data.error ?? "Salvataggio non riuscito.");
        return;
      }
      if (notify && !data.notified) {
        window.alert("Modifiche salvate, ma l'email alla cliente non è partita.");
      }
      onSaved(reviveBooking(data.booking));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Eliminare definitivamente l'appuntamento di ${booking.customerName}?`)) {
      return;
    }
    const res = await fetch(`/api/admin/bookings/${booking.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(booking.id);
    else setError("Eliminazione non riuscita.");
  }

  return (
    <AdminDialog title="Modifica appuntamento" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            Nome
            <input required value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} className={field} />
          </label>
          <label className="text-sm">
            Cognome
            <input value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} className={field} />
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">
            Email
            <input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} className={field} />
          </label>
          <label className="text-sm">
            Telefono
            <input type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} className={field} />
          </label>
        </div>
        <label className="block text-sm">
          Servizio
          <input required value={form.serviceName} onChange={(e) => set("serviceName")(e.target.value)} className={field} />
        </label>

        <div className="rounded-2xl border border-line p-3">
          <div className="grid grid-cols-3 gap-2">
            <label className="text-sm">
              Data
              <input required type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} className={field} />
            </label>
            <label className="text-sm">
              Inizio
              <input required type="time" step={300} value={form.start} onChange={(e) => set("start")(e.target.value)} className={field} />
            </label>
            <label className="text-sm">
              Fine
              <input required type="time" step={300} value={form.end} onChange={(e) => set("end")(e.target.value)} className={field} />
            </label>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={minutes > 0 ? "text-muted" : "text-rose-700 dark:text-rose"}>
              Durata: {minutes > 0 ? `${minutes} min` : "non valida"}
            </span>
            <span className="text-muted">·</span>
            <button type="button" className="rounded-full border border-line px-2 py-0.5" onClick={() => setForm((c) => ({ ...c, start: shiftTime(c.start, -15), end: shiftTime(c.end, -15) }))}>
              Anticipa 15′
            </button>
            <button type="button" className="rounded-full border border-line px-2 py-0.5" onClick={() => setForm((c) => ({ ...c, start: shiftTime(c.start, 15), end: shiftTime(c.end, 15) }))}>
              Posticipa 15′
            </button>
            <button type="button" className="rounded-full border border-line px-2 py-0.5" onClick={() => set("end")(shiftTime(form.end, -15))}>
              −15′ durata
            </button>
            <button type="button" className="rounded-full border border-line px-2 py-0.5" onClick={() => set("end")(shiftTime(form.end, 15))}>
              +15′ durata
            </button>
          </div>
        </div>

        <label className="block text-sm">
          Stato
          <select value={form.status} onChange={(e) => set("status")(e.target.value)} className={field}>
            {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Note
          <textarea rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} className={field} />
        </label>
        {booking.extras.length > 0 ? (
          <p className="text-sm text-muted">
            Extra: {booking.extras.map((extra) => extra.name).join(", ")}
          </p>
        ) : null}
        <label className={`flex items-center gap-2 text-sm ${form.email ? "" : "text-muted"}`}>
          <input
            type="checkbox"
            disabled={!form.email}
            checked={notify && Boolean(form.email)}
            onChange={(e) => setNotify(e.target.checked)}
          />
          {form.email
            ? `Avvisa la cliente via email${timesChanged ? " del nuovo orario" : ""}`
            : "Aggiungi un'email per poter avvisare la cliente"}
        </label>

        {error ? (
          <div className="rounded-xl bg-blush/50 p-3 text-sm text-mauve">
            <p>{error}</p>
            {conflict ? (
              <button type="button" disabled={saving} onClick={() => save(true)} className="mt-2 rounded-full border border-mauve px-3 py-1 text-xs">
                Salva comunque
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button type="button" onClick={remove} className="rounded-full border border-line px-4 py-2 text-sm text-rose-700 dark:text-rose">
            Elimina
          </button>
          <button type="submit" disabled={saving || minutes <= 0} className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-[#3a2c2e] disabled:opacity-50">
            {saving ? "Salvo…" : "Salva modifiche"}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
