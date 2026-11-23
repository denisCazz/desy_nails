"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/db/schema";

type Availability = { date: string; slots: string[] };

const inputClass = "rounded-xl border border-line bg-paper px-3 py-2";

export function BookingForm({
  services,
  extras,
  formToken,
  captchaSiteKey,
}: {
  services: Service[];
  extras: Service[];
  formToken: string;
  captchaSiteKey: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const bookable = services.filter((service) => service.bookable && service.active);
  const [serviceId, setServiceId] = useState(bookable[0]?.id ?? "");
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; days: Availability[] }>({
    key: "",
    days: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = bookable.find((service) => service.id === serviceId);
  const totalMinutes =
    (selected?.durationMinutes ?? 0) +
    extras
      .filter((extra) => extraIds.includes(extra.id))
      .reduce((sum, extra) => sum + extra.durationMinutes, 0);

  const requestKey = `${serviceId}:${reloadKey}`;
  const loading = Boolean(serviceId) && loaded.key !== requestKey;
  const availability = loaded.key === requestKey ? loaded.days : [];

  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    fetch(`/api/availability?serviceId=${encodeURIComponent(serviceId)}`)
      .then((res) => res.json() as Promise<{ days?: Availability[]; error?: string }>)
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        setLoaded({ key: requestKey, days: data.days ?? [] });
      })
      .catch(() => {
        if (cancelled) return;
        setError("Impossibile caricare gli orari.");
        setLoaded({ key: requestKey, days: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, requestKey]);

  const reloadAvailability = useCallback(() => setReloadKey((key) => key + 1), []);

  function chooseService(id: string) {
    setServiceId(id);
    setDate("");
    setTime("");
  }

  const daySlots = useMemo(
    () => availability.find((day) => day.date === date)?.slots ?? [],
    [availability, date],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setMessage("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      if (captchaSiteKey && !captchaToken) {
        setError("Completa la verifica anti-bot qui sopra.");
        return;
      }

      const payload = {
        serviceId,
        extraIds,
        date,
        time,
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        notes: String(form.get("notes") ?? ""),
        website: String(form.get("website") ?? ""),
        formToken,
        captchaToken: captchaToken ?? "",
      };
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Prenotazione non riuscita.");
        if (res.status === 409) {
          setTime("");
          reloadAvailability();
        }
        return;
      }
      setMessage("Richiesta inviata! Ti ho mandato un'email di riepilogo: ti confermerò l'appuntamento al più presto.");
      formRef.current?.reset();
      setExtraIds([]);
      setDate("");
      setTime("");
      reloadAvailability();
    } catch {
      setError("Connessione non riuscita. Riprova.");
    } finally {
      setSubmitting(false);
      if (captchaSiteKey) setCaptchaReset((key) => key + 1);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
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
                    onChange={() => chooseService(service.id)}
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
        {totalMinutes > 0 ? (
          <p className="mt-1 text-sm text-muted">Durata stimata: {totalMinutes} min</p>
        ) : null}
        {loading ? <p className="mt-3 text-sm text-muted">Carico gli slot…</p> : null}
        {!loading && availability.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nessun orario libero nelle prossime settimane.</p>
        ) : null}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              name="firstName"
              autoComplete="given-name"
              placeholder="Nome"
              minLength={2}
              maxLength={60}
              className={inputClass}
            />
            <input
              required
              name="lastName"
              autoComplete="family-name"
              placeholder="Cognome"
              minLength={2}
              maxLength={60}
              className={inputClass}
            />
          </div>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            maxLength={255}
            className={inputClass}
          />
          <input
            required
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            placeholder="Telefono"
            pattern="[+]?[0-9 ().\-]{8,20}"
            title="Inserisci un numero di telefono valido"
            className={inputClass}
          />
          <textarea
            name="notes"
            placeholder="Note (forma, colore, richieste)"
            rows={3}
            maxLength={1000}
            className={inputClass}
          />
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Sito web
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label className="flex items-start gap-2 text-xs text-muted">
            <input required type="checkbox" name="privacy" className="mt-0.5" />
            <span>
              Acconsento al trattamento dei miei dati per la gestione della prenotazione.
            </span>
          </label>
        </div>
        {captchaSiteKey ? (
          <div className="mt-4">
            <TurnstileWidget
              siteKey={captchaSiteKey}
              action="booking"
              resetKey={captchaReset}
              onTokenChange={setCaptchaToken}
            />
          </div>
        ) : null}
        <button
          type="submit"
          disabled={!selected || !date || !time || submitting || (Boolean(captchaSiteKey) && !captchaToken)}
          className="mt-5 w-full rounded-full bg-gold py-3 font-medium text-[#3a2c2e] disabled:opacity-50"
        >
          {submitting ? "Invio in corso…" : "Invia richiesta"}
        </button>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="mt-3 text-sm text-mauve">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
