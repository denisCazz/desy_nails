"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/db/schema";

type Availability = { date: string; slots: string[] };

export function BookingForm({
  services,
  extras,
}: {
  services: Service[];
  extras: Service[];
}) {
  const bookable = services.filter((service) => service.bookable && service.active);
  const [serviceId, setServiceId] = useState(bookable[0]?.id ?? "");
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = bookable.find((service) => service.id === serviceId);

  useEffect(() => {
    if (!serviceId) return;
    setDate("");
    setTime("");
    setLoading(true);
    fetch(`/api/availability?serviceId=${encodeURIComponent(serviceId)}`)
      .then((res) => res.json())
      .then((data: { days?: Availability[]; error?: string }) => {
        if (data.error) setError(data.error);
        else setAvailability(data.days ?? []);
      })
      .catch(() => setError("Impossibile caricare gli orari."))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const daySlots = useMemo(
    () => availability.find((day) => day.date === date)?.slots ?? [],
    [availability, date],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      serviceId,
      extraIds,
      date,
      time,
      customerName: String(form.get("customerName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      notes: String(form.get("notes") ?? ""),
    };
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string; ok?: boolean };
    if (!res.ok) {
      setError(data.error ?? "Prenotazione non riuscita.");
      return;
    }
    setMessage("Richiesta inviata. Ti confermerò l’appuntamento al più presto.");
    event.currentTarget.reset();
    setTime("");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <fieldset>
          <legend className="font-serif text-2xl text-mauve">Scegli il servizio</legend>
          <div className="mt-4 grid gap-3">
            {bookable.map((service) => (
              <label
                key={service.id}
                className={`gold-border flex cursor-pointer items-start justify-between gap-3 rounded-2xl p-4 ${
                  serviceId === service.id ? "bg-blush/40 dark:bg-blush/30" : "bg-surface"
                }`}
              >
                <span>
                  <input
                    type="radio"
                    name="service"
                    className="sr-only"
                    checked={serviceId === service.id}
                    onChange={() => setServiceId(service.id)}
                  />
                  <span className="block font-medium">{service.name}</span>
                  <span className="text-sm text-muted">
                    {service.durationMinutes} min
                  </span>
                </span>
                <span className="font-serif text-xl text-gold">
                  {formatPrice(service.priceCents, {
                    from: service.priceFrom,
                    note: service.priceNote || undefined,
                  })}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-serif text-2xl text-mauve">Extra</legend>
          <div className="mt-4 grid gap-2">
            {extras.map((extra) => (
              <label key={extra.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={extraIds.includes(extra.id)}
                    onChange={() =>
                      setExtraIds((current) =>
                        current.includes(extra.id)
                          ? current.filter((id) => id !== extra.id)
                          : [...current, extra.id],
                      )
                    }
                  />
                  {extra.name}
                </span>
                <span className="text-gold">
                  {formatPrice(extra.priceCents, {
                    from: extra.priceFrom,
                    note: extra.priceNote || undefined,
                  })}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="gold-border rounded-3xl bg-surface p-6">
        <h3 className="font-serif text-2xl text-mauve">Quando</h3>
        {loading ? <p className="mt-3 text-sm text-muted">Carico gli slot…</p> : null}
        <div className="mt-4 grid max-h-48 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
          {availability.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => {
                setDate(day.date);
                setTime("");
              }}
              className={`rounded-xl border px-2 py-2 text-sm ${
                date === day.date
                  ? "border-gold bg-blush/50"
                  : "border-line hover:border-gold"
              }`}
            >
              {new Date(`${day.date}T12:00:00`).toLocaleDateString("it-IT", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </button>
          ))}
        </div>
        {date ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {daySlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  time === slot ? "border-gold bg-gold text-ink" : "border-line"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Seleziona un giorno disponibile.</p>
        )}

        <div className="mt-6 grid gap-3">
          <input
            required
            name="customerName"
            placeholder="Nome e cognome"
            className="rounded-xl border border-line bg-paper px-3 py-2"
          />
          <input
            required
            type="email"
            name="email"
            placeholder="Email"
            className="rounded-xl border border-line bg-paper px-3 py-2"
          />
          <input
            name="phone"
            placeholder="Telefono"
            className="rounded-xl border border-line bg-paper px-3 py-2"
          />
          <textarea
            name="notes"
            placeholder="Note (forma, colore, richieste)"
            rows={3}
            className="rounded-xl border border-line bg-paper px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={!selected || !date || !time}
          className="mt-5 w-full rounded-full bg-gold py-3 font-medium text-[#3a2c2e] disabled:opacity-50"
        >
          Invia richiesta
        </button>
        {error ? <p className="mt-3 text-sm text-rose-700 dark:text-rose">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-mauve">{message}</p> : null}
      </div>
    </form>
  );
}
