"use client";

import { Check, Clock, Pencil } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DatePicker, formatLongDate } from "@/components/booking/date-picker";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/db/schema";

type Availability = { date: string; slots: string[] };
type Confirmation = {
  service: string;
  date: string;
  time: string;
  email: string;
};

const inputClass =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-base placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";
const labelClass = "mb-1 block text-sm font-medium text-ink";

function scrollIntoViewOnMobile(element: HTMLElement | null) {
  if (!element || !window.matchMedia("(max-width: 1023px)").matches) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

function StepTitle({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold/90 text-sm font-semibold text-[#3a2c2e]">
        {step}
      </span>
      <div>
        <h3 className="font-serif text-xl text-mauve sm:text-2xl">{title}</h3>
        {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function BookingForm({
  services,
  extras,
  formToken,
  captchaSiteKey,
  today,
  initialServiceId = "",
}: {
  services: Service[];
  extras: Service[];
  formToken: string;
  captchaSiteKey: string;
  /** Data di oggi a Roma (YYYY-MM-DD), calcolata sul server per evitare differenze di fuso. */
  today: string;
  initialServiceId?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const whenRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);

  const bookable = services.filter(
    (service) => service.bookable && service.active,
  );
  const [serviceId, setServiceId] = useState(
    bookable.some((service) => service.id === initialServiceId)
      ? initialServiceId
      : "",
  );
  const [servicesOpen, setServicesOpen] = useState(!serviceId);
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
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState("");

  const selected = bookable.find((service) => service.id === serviceId);
  const chosenExtras = extras.filter((extra) => extraIds.includes(extra.id));
  const totalMinutes =
    (selected?.durationMinutes ?? 0) +
    chosenExtras.reduce((sum, extra) => sum + extra.durationMinutes, 0);
  const priced = [selected, ...chosenExtras].filter((item): item is Service =>
    Boolean(item),
  );
  const totalCents = priced.reduce(
    (sum, item) => sum + (item.priceCents ?? 0),
    0,
  );
  const totalFrom = priced.some(
    (item) => item.priceFrom || item.priceCents == null,
  );

  const extrasKey = [...extraIds].sort().join(",");
  const requestKey = `${serviceId}:${extrasKey}:${reloadKey}`;
  const loading = Boolean(serviceId) && loaded.key !== requestKey;
  const availability = loaded.key.startsWith(`${serviceId}:`)
    ? loaded.days
    : [];

  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    const params = new URLSearchParams({ serviceId });
    if (extrasKey) params.set("extras", extrasKey);
    fetch(`/api/availability?${params}`)
      .then(
        (res) =>
          res.json() as Promise<{ days?: Availability[]; error?: string }>,
      )
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        setLoaded({ key: requestKey, days: data.days ?? [] });
      })
      .catch(() => {
        if (cancelled) return;
        setError(
          "Impossibile caricare gli orari. Controlla la connessione e riprova.",
        );
        setLoaded({ key: requestKey, days: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, extrasKey, requestKey]);

  const reloadAvailability = useCallback(
    () => setReloadKey((key) => key + 1),
    [],
  );

  const availableDates = availability.map((day) => day.date);
  const effectiveDate = availableDates.includes(date) ? date : "";
  const daySlots =
    availability.find((day) => day.date === effectiveDate)?.slots ?? [];
  const effectiveTime = daySlots.includes(time) ? time : "";
  const morning = daySlots.filter((slot) => slot < "13:00");
  const afternoon = daySlots.filter((slot) => slot >= "13:00");

  function chooseService(id: string) {
    setServiceId(id);
    setServicesOpen(false);
    setDate("");
    setTime("");
    setError("");
    requestAnimationFrame(() => scrollIntoViewOnMobile(whenRef.current));
  }

  function chooseDate(value: string) {
    setDate(value);
    setTime("");
    requestAnimationFrame(() => scrollIntoViewOnMobile(slotsRef.current));
  }

  function chooseTime(value: string) {
    setTime(value);
    requestAnimationFrame(() => scrollIntoViewOnMobile(detailsRef.current));
  }

  function toggleExtra(id: string) {
    setExtraIds((current) =>
      current.includes(id)
        ? current.filter((extraId) => extraId !== id)
        : [...current, id],
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !selected || !effectiveDate || !effectiveTime) return;
    setError("");
    if (captchaSiteKey && !captchaToken) {
      setError("Attendi la verifica anti-bot qui sopra, poi riprova.");
      return;
    }
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          extraIds,
          date: effectiveDate,
          time: effectiveTime,
          firstName: String(form.get("firstName") ?? ""),
          lastName: String(form.get("lastName") ?? ""),
          email,
          phone: String(form.get("phone") ?? ""),
          notes: String(form.get("notes") ?? ""),
          website: String(form.get("website") ?? ""),
          formToken,
          captchaToken: captchaToken ?? "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Prenotazione non riuscita. Riprova.");
        if (res.status === 409) {
          setTime("");
          reloadAvailability();
          requestAnimationFrame(() => scrollIntoViewOnMobile(slotsRef.current));
        }
        return;
      }
      setConfirmation({
        service: selected.name,
        date: effectiveDate,
        time: effectiveTime,
        email,
      });
      formRef.current?.reset();
      setExtraIds([]);
      setDate("");
      setTime("");
      reloadAvailability();
      requestAnimationFrame(() =>
        confirmationRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      );
    } catch {
      setError("Connessione non riuscita. Riprova.");
    } finally {
      setSubmitting(false);
      if (captchaSiteKey) setCaptchaReset((key) => key + 1);
    }
  }

  if (confirmation) {
    return (
      <div
        ref={confirmationRef}
        role="status"
        className="gold-border mx-auto max-w-lg rounded-3xl bg-surface p-6 text-center sm:p-10"
      >
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold/90 text-[#3a2c2e]">
          <Check className="size-7" />
        </span>
        <h3 className="mt-4 font-serif text-2xl text-mauve sm:text-3xl">
          Richiesta inviata!
        </h3>
        <p className="mt-3 text-muted">
          <strong className="text-ink">{confirmation.service}</strong>
          <br />
          {capitalize(formatLongDate(confirmation.date))} alle{" "}
          {confirmation.time}
        </p>
        <p className="mt-4 text-sm text-muted">
          Ti ho mandato un riepilogo a{" "}
          <strong className="text-ink">{confirmation.email}</strong>. Ti
          confermerò l&apos;appuntamento al più presto.
        </p>
        <button
          type="button"
          onClick={() => {
            setConfirmation(null);
            setServicesOpen(true);
          }}
          className="mt-6 rounded-full border border-gold px-6 py-3 text-sm"
        >
          Prenota un altro appuntamento
        </button>
      </div>
    );
  }

  const canSubmit =
    Boolean(selected && effectiveDate && effectiveTime) &&
    !submitting &&
    !loading &&
    (!captchaSiteKey || Boolean(captchaToken));

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-8"
    >
      <div className="space-y-6">
        <section className="space-y-5">
          <StepTitle step={1} title="Scegli il servizio" />

          {selected && !servicesOpen ? (
            <div className="gold-border flex items-center justify-between gap-3 rounded-2xl bg-blush/40 p-4 dark:bg-blush/25">
              <div className="min-w-0">
                <p className="font-medium">{selected.name}</p>
                <p className="flex items-center gap-1 text-sm text-muted">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {durationLabel(selected.durationMinutes)} ·{" "}
                  {formatPrice(selected.priceCents, {
                    from: selected.priceFrom,
                    note: selected.priceNote || undefined,
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setServicesOpen(true)}
                className="flex shrink-0 items-center gap-1 rounded-full border border-gold px-4 py-2 text-sm"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Cambia
              </button>
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label="Servizio"
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
            >
              {bookable.map((service) => {
                const active = serviceId === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => chooseService(service.id)}
                    className={`gold-border flex min-h-16 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      active
                        ? "bg-blush/50 dark:bg-blush/30"
                        : "bg-surface hover:bg-blush/20"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium leading-snug">
                        {service.name}
                      </span>
                      <span className="text-sm text-muted">
                        {durationLabel(service.durationMinutes)}
                        {service.priceNote &&
                        service.priceNote.toLowerCase() !== "inclusa"
                          ? ` · ${service.priceNote}`
                          : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-serif text-lg text-gold">
                      {formatPrice(service.priceCents, {
                        from: service.priceFrom,
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selected && extras.length > 0 ? (
            <fieldset>
              <legend className="text-sm font-medium text-ink">
                Extra{" "}
                <span className="font-normal text-muted">(facoltativi)</span>
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {extras.map((extra) => {
                  const active = extraIds.includes(extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleExtra(extra.id)}
                      className={`flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-left text-sm transition ${
                        active
                          ? "border-gold bg-gold/90 text-[#3a2c2e]"
                          : "border-line bg-surface hover:border-gold"
                      }`}
                    >
                      {active ? (
                        <Check className="size-4 shrink-0" aria-hidden="true" />
                      ) : null}
                      <span>{extra.name}</span>
                      <span
                        className={active ? "text-[#3a2c2e]/80" : "text-gold"}
                      >
                        {formatPrice(extra.priceCents, {
                          from: extra.priceFrom,
                          note: extra.priceNote || undefined,
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
        </section>

        <div className="gold-border space-y-8 rounded-3xl bg-surface p-4 sm:p-6">
          <section ref={whenRef} className="scroll-mt-24 space-y-4">
            <StepTitle
              step={2}
              title="Scegli il giorno"
              hint={
                selected
                  ? `Durata stimata: ${durationLabel(totalMinutes)}`
                  : undefined
              }
            />
            {!selected ? (
              <p className="rounded-2xl bg-blush/25 p-4 text-sm text-muted">
                Scegli prima un servizio per vedere i giorni liberi.
              </p>
            ) : !loading && availability.length === 0 && !error ? (
              <p className="rounded-2xl bg-blush/25 p-4 text-sm text-muted">
                Nessun giorno libero nelle prossime settimane. Scrivimi su
                Instagram e troviamo una soluzione.
              </p>
            ) : (
              <div aria-busy={loading}>
                <DatePicker
                  today={today}
                  availableDates={availableDates}
                  value={effectiveDate}
                  onChange={chooseDate}
                  disabled={loading}
                />
                {loading ? (
                  <p className="mt-2 text-center text-xs text-muted">
                    Aggiorno i giorni liberi…
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <section ref={slotsRef} className="scroll-mt-24 space-y-4">
            <StepTitle
              step={3}
              title="Scegli l'orario"
              hint={
                effectiveDate
                  ? capitalize(formatLongDate(effectiveDate))
                  : undefined
              }
            />
            {!effectiveDate ? (
              <p className="rounded-2xl bg-blush/25 p-4 text-sm text-muted">
                Scegli un giorno nel calendario per vedere gli orari liberi.
              </p>
            ) : null}
            {[
              ["Mattina", morning],
              ["Pomeriggio", afternoon],
            ].map(([label, slots]) =>
              (slots as string[]).length > 0 ? (
                <div key={label as string}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                    {label}
                  </p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {(slots as string[]).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        aria-pressed={effectiveTime === slot}
                        onClick={() => chooseTime(slot)}
                        className={`h-11 rounded-xl border text-sm font-medium tabular-nums transition ${
                          effectiveTime === slot
                            ? "border-gold bg-gold text-[#3a2c2e]"
                            : "border-line bg-paper hover:border-gold"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </section>
        </div>
      </div>

      <div className="gold-border space-y-8 rounded-3xl bg-surface p-4 sm:p-6 lg:sticky lg:top-24">
        <section ref={detailsRef} className="scroll-mt-24 space-y-4">
          <StepTitle step={4} title="I tuoi dati" />
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={labelClass}>Nome</span>
              <input
                required
                name="firstName"
                autoComplete="given-name"
                autoCapitalize="words"
                enterKeyHint="next"
                minLength={2}
                maxLength={60}
                className={inputClass}
              />
            </label>
            <label>
              <span className={labelClass}>Cognome</span>
              <input
                required
                name="lastName"
                autoComplete="family-name"
                autoCapitalize="words"
                enterKeyHint="next"
                minLength={2}
                maxLength={60}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              maxLength={255}
              placeholder="nome@email.it"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Telefono</span>
            <input
              required
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="next"
              placeholder="333 123 4567"
              pattern="[+]?[0-9 ().\-]{8,20}"
              title="Inserisci un numero di telefono valido"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>
              Note <span className="font-normal text-muted">(facoltative)</span>
            </span>
            <textarea
              name="notes"
              placeholder="Forma, colore, idee…"
              rows={3}
              maxLength={1000}
              className={inputClass}
            />
          </label>
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] h-px w-px overflow-hidden"
          >
            <label>
              Sito web
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>
          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              required
              type="checkbox"
              name="privacy"
              className="mt-0.5 size-5 shrink-0 accent-gold"
            />
            <span>
              Acconsento al trattamento dei miei dati per la gestione della
              prenotazione.
            </span>
          </label>
        </section>

        <section className="space-y-4">
          {selected ? (
            <div className="rounded-2xl bg-blush/30 p-4 text-sm dark:bg-blush/20">
              <p className="font-medium text-ink">{selected.name}</p>
              {chosenExtras.length > 0 ? (
                <p className="text-muted">
                  + {chosenExtras.map((extra) => extra.name).join(", ")}
                </p>
              ) : null}
              <p className="mt-1 text-muted">
                {effectiveDate
                  ? capitalize(formatLongDate(effectiveDate))
                  : "Giorno da scegliere"}
                {effectiveTime ? ` alle ${effectiveTime}` : ""} ·{" "}
                {durationLabel(totalMinutes)}
              </p>
              <p className="mt-1 font-serif text-lg text-gold">
                {formatPrice(totalCents, { from: totalFrom })}
                <span className="ml-1 font-sans text-xs text-muted">
                  indicativo
                </span>
              </p>
            </div>
          ) : null}

          {captchaSiteKey ? (
            <TurnstileWidget
              siteKey={captchaSiteKey}
              action="booking"
              resetKey={captchaReset}
              onTokenChange={setCaptchaToken}
            />
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-rose/15 px-4 py-3 text-sm text-rose-700 dark:text-rose"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="h-13 w-full rounded-full bg-gold text-base font-medium text-[#3a2c2e] transition disabled:opacity-50"
          >
            {submitting
              ? "Invio in corso…"
              : !selected
                ? "Scegli un servizio"
                : !effectiveDate
                  ? "Scegli un giorno"
                  : !effectiveTime
                    ? "Scegli un orario"
                    : "Invia richiesta"}
          </button>
        </section>
      </div>
    </form>
  );
}
