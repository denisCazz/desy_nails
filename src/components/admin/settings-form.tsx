"use client";

import {
  CalendarSync,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Store,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { DEFAULT_MIN_NOTICE_HOURS } from "@/lib/booking-rules";

type TimeWindow = { start: string; end: string };
type Hours = Record<string, TimeWindow[]>;
type Values = {
  phone: string;
  address: string;
  instagram: string;
  caldav_url: string;
  caldav_username: string;
  caldav_password: string;
  caldav_calendar_url: string;
  min_notice_hours: string;
  buffer_minutes: string;
};

const DAYS: [string, string][] = [
  ["1", "Lunedì"],
  ["2", "Martedì"],
  ["3", "Mercoledì"],
  ["4", "Giovedì"],
  ["5", "Venerdì"],
  ["6", "Sabato"],
  ["0", "Domenica"],
];

const inputClass =
  "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-base focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 sm:text-sm";
const timeClass =
  "w-[6.5rem] rounded-lg border border-line bg-paper px-2 py-2 text-base tabular-nums focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 sm:text-sm";

function parseHours(raw: string | undefined): Hours {
  try {
    const parsed = JSON.parse(raw || "{}") as Hours;
    return Object.fromEntries(DAYS.map(([key]) => [key, parsed[key] ?? []]));
  } catch {
    return Object.fromEntries(DAYS.map(([key]) => [key, []]));
  }
}

/** Errore leggibile per un giorno, oppure null se le fasce sono valide. */
function dayError(windows: TimeWindow[]) {
  const sorted = [...windows].sort((a, b) => a.start.localeCompare(b.start));
  for (const [index, window] of sorted.entries()) {
    if (!window.start || !window.end) return "Completa gli orari.";
    if (window.start >= window.end)
      return "L'orario di fine deve essere dopo l'inizio.";
    const previous = sorted[index - 1];
    if (previous && window.start < previous.end)
      return "Le fasce si sovrappongono.";
  }
  return null;
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Nuova fascia: divide quella che copre il pranzo (13–14), altrimenti ne aggiunge una dopo l'ultima. */
function withExtraWindow(windows: TimeWindow[]): TimeWindow[] {
  const sorted = [...windows].sort((a, b) => a.start.localeCompare(b.start));
  const lunch = sorted.findIndex((w) => w.start < "13:00" && w.end > "14:00");
  if (lunch >= 0) {
    const window = sorted[lunch];
    return [
      ...sorted.slice(0, lunch),
      { start: window.start, end: "13:00" },
      { start: "14:00", end: window.end },
      ...sorted.slice(lunch + 1),
    ];
  }
  const lastEnd = sorted.length
    ? toMinutes(sorted[sorted.length - 1].end)
    : 14 * 60;
  const start = Math.min(lastEnd + 60, 22 * 60);
  return [
    ...sorted,
    { start: toTime(start), end: toTime(Math.min(start + 120, 23 * 60 + 30)) },
  ];
}

function Card({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="gold-border rounded-2xl bg-surface p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush/50 text-mauve dark:bg-blush/25">
          {icon}
        </span>
        <div>
          <h3 className="font-serif text-xl text-mauve">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm"
    >
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-gold" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
      <span className={`w-14 text-left ${checked ? "text-ink" : "text-muted"}`}>
        {checked ? "Aperto" : "Chiuso"}
      </span>
    </button>
  );
}

export function SettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const initialValues: Values = {
    phone: settings.phone ?? "",
    address: settings.address ?? "",
    instagram: (settings.instagram ?? "").replace(/^@/, ""),
    caldav_url: settings.caldav_url ?? "",
    caldav_username: settings.caldav_username ?? "",
    caldav_password: settings.caldav_password ?? "",
    caldav_calendar_url: settings.caldav_calendar_url ?? "",
    min_notice_hours:
      settings.min_notice_hours ?? String(DEFAULT_MIN_NOTICE_HOURS),
    buffer_minutes: settings.buffer_minutes ?? "0",
  };
  const [values, setValues] = useState(initialValues);
  const [hours, setHours] = useState(() => parseHours(settings.working_hours));
  const [saved, setSaved] = useState(() =>
    JSON.stringify({
      values: initialValues,
      hours: parseHours(settings.working_hours),
    }),
  );
  const [status, setStatus] = useState<{
    kind: "idle" | "saving" | "saved" | "error";
    message?: string;
  }>({
    kind: "idle",
  });
  const [showPassword, setShowPassword] = useState(false);

  const snapshot = JSON.stringify({ values, hours });
  const dirty = snapshot !== saved;
  const errors = Object.fromEntries(
    DAYS.map(([key]) => [key, dayError(hours[key])]),
  );
  const hasErrors = Object.values(errors).some(Boolean);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus({ kind: "idle" });
  }

  function updateDay(key: string, windows: TimeWindow[]) {
    setHours((current) => ({ ...current, [key]: windows }));
    setStatus({ kind: "idle" });
  }

  function copyToOpenDays(key: string) {
    setHours((current) =>
      Object.fromEntries(
        DAYS.map(([day]) => [
          day,
          day === key || current[day].length === 0
            ? current[day]
            : current[key].map((w) => ({ ...w })),
        ]),
      ),
    );
    setStatus({ kind: "idle" });
  }

  async function save() {
    if (hasErrors) {
      setStatus({
        kind: "error",
        message: "Correggi gli orari segnati in rosso.",
      });
      return;
    }
    setStatus({ kind: "saving" });
    const workingHours = Object.fromEntries(
      DAYS.map(([key]) => [
        key,
        [...hours[key]].sort((a, b) => a.start.localeCompare(b.start)),
      ]),
    );
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          working_hours: JSON.stringify(workingHours),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Salvataggio non riuscito.",
        });
        return;
      }
      setSaved(snapshot);
      setStatus({ kind: "saved" });
      window.setTimeout(
        () =>
          setStatus((current) =>
            current.kind === "saved" ? { kind: "idle" } : current,
          ),
        2500,
      );
    } catch {
      setStatus({
        kind: "error",
        message: "Connessione non riuscita. Riprova.",
      });
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-6 pb-28"
    >
      <Card
        icon={<Clock className="size-4" />}
        title="Orari di lavoro"
        description="Aggiungi più fasce per la pausa pranzo (es. 09:00–12:30 e 14:00–19:00)."
      >
        <div className="divide-y divide-line">
          {DAYS.map(([key, label]) => {
            const windows = hours[key];
            const open = windows.length > 0;
            const error = errors[key];
            return (
              <div
                key={key}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
              >
                <div className="flex items-center justify-between gap-3 sm:w-52 sm:shrink-0 sm:pt-1.5">
                  <span className="font-medium">{label}</span>
                  <Switch
                    checked={open}
                    label={`${label} aperto`}
                    onChange={(checked) =>
                      updateDay(
                        key,
                        checked ? [{ start: "09:30", end: "19:00" }] : [],
                      )
                    }
                  />
                </div>

                {open ? (
                  <div className="flex-1 space-y-2">
                    {windows.map((window, index) => (
                      <div
                        key={index}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input
                          type="time"
                          step={300}
                          aria-label={`${label}, fascia ${index + 1}, inizio`}
                          value={window.start}
                          onChange={(event) =>
                            updateDay(
                              key,
                              windows.map((w, i) =>
                                i === index
                                  ? { ...w, start: event.target.value }
                                  : w,
                              ),
                            )
                          }
                          className={timeClass}
                        />
                        <span className="text-muted">–</span>
                        <input
                          type="time"
                          step={300}
                          aria-label={`${label}, fascia ${index + 1}, fine`}
                          value={window.end}
                          onChange={(event) =>
                            updateDay(
                              key,
                              windows.map((w, i) =>
                                i === index
                                  ? { ...w, end: event.target.value }
                                  : w,
                              ),
                            )
                          }
                          className={timeClass}
                        />
                        {windows.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateDay(
                                key,
                                windows.filter((_, i) => i !== index),
                              )
                            }
                            aria-label={`Rimuovi fascia ${index + 1} di ${label}`}
                            className="grid size-9 place-items-center rounded-full text-muted hover:bg-blush/40 hover:text-mauve"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {error ? (
                      <p className="text-xs text-rose-700 dark:text-rose">
                        {error}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
                      <button
                        type="button"
                        onClick={() => updateDay(key, withExtraWindow(windows))}
                        className="flex items-center gap-1 text-gold hover:underline"
                      >
                        <Plus className="size-4" /> Aggiungi fascia
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToOpenDays(key)}
                        className="flex items-center gap-1 text-muted hover:text-mauve"
                      >
                        <Copy className="size-3.5" /> Copia sugli altri giorni
                        aperti
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted sm:pt-2">
                    Nessuna prenotazione possibile.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        icon={<CalendarSync className="size-4" />}
        title="Regole di prenotazione"
        description="Valgono per il calendario online delle clienti."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Preavviso minimo"
            hint="Le clienti non possono prenotare un orario più vicino di così."
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={336}
                value={values.min_notice_hours}
                onChange={(event) =>
                  set("min_notice_hours", event.target.value)
                }
                className={`${inputClass} max-w-28`}
              />
              <span className="text-sm text-muted">ore</span>
            </div>
          </Field>
          <Field
            label="Pausa tra appuntamenti"
            hint="Tempo lasciato libero dopo ogni appuntamento."
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                step={5}
                value={values.buffer_minutes}
                onChange={(event) => set("buffer_minutes", event.target.value)}
                className={`${inputClass} max-w-28`}
              />
              <span className="text-sm text-muted">minuti</span>
            </div>
          </Field>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          icon={<Store className="size-4" />}
          title="Studio"
          description="Mostrati nel sito e nelle email."
        >
          <div className="space-y-4">
            <Field label="Telefono">
              <input
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(event) => set("phone", event.target.value)}
                placeholder="333 123 4567"
                className={inputClass}
              />
            </Field>
            <Field label="Indirizzo">
              <input
                value={values.address}
                onChange={(event) => set("address", event.target.value)}
                placeholder="Via, numero, città"
                className={inputClass}
              />
            </Field>
            <Field label="Instagram">
              <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-paper focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30">
                <span className="grid place-items-center bg-blush/30 px-3 text-muted">
                  @
                </span>
                <input
                  value={values.instagram}
                  onChange={(event) =>
                    set(
                      "instagram",
                      event.target.value.replace(/^@/, "").trim(),
                    )
                  }
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="__desy.nails__"
                  className="w-full bg-transparent px-3 py-2.5 text-base focus:outline-none sm:text-sm"
                />
              </div>
            </Field>
          </div>
        </Card>

        <Card
          icon={<CalendarSync className="size-4" />}
          title="Calendario iPhone (iCloud)"
          description={
            <>
              Gli eventi creati sul telefono diventano orari occupati sul sito.
              Server: <code className="text-xs">https://caldav.icloud.com</code>
              , utente: Apple ID, password: una{" "}
              <a
                href="https://support.apple.com/it-it/102654"
                target="_blank"
                rel="noreferrer"
                className="text-gold underline-offset-2 hover:underline"
              >
                password per app
              </a>
              .
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Server CalDAV">
              <input
                type="url"
                value={values.caldav_url}
                onChange={(event) => set("caldav_url", event.target.value)}
                placeholder="https://caldav.icloud.com"
                className={inputClass}
              />
            </Field>
            <Field label="Apple ID">
              <input
                type="email"
                autoComplete="off"
                value={values.caldav_username}
                onChange={(event) => set("caldav_username", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Password per app">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={values.caldav_password}
                  onChange={(event) =>
                    set("caldav_password", event.target.value)
                  }
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  aria-label={
                    showPassword ? "Nascondi password" : "Mostra password"
                  }
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-mauve"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </Field>
            <Field
              label="URL calendario"
              hint="Facoltativo: se vuoto viene usato il primo calendario."
            >
              <input
                type="url"
                value={values.caldav_calendar_url}
                onChange={(event) =>
                  set("caldav_calendar_url", event.target.value)
                }
                className={inputClass}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div
        inert={!(dirty || status.kind !== "idle")}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur transition-transform duration-300 print:hidden ${
          dirty || status.kind !== "idle" ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p
            role="status"
            className={`text-sm ${status.kind === "error" ? "text-rose-700 dark:text-rose" : "text-muted"}`}
          >
            {status.kind === "saving"
              ? "Salvataggio…"
              : status.kind === "saved" && !dirty
                ? "Impostazioni salvate ✓"
                : status.kind === "error"
                  ? status.message
                  : "Hai modifiche non salvate"}
          </p>
          <div className="flex shrink-0 gap-2">
            {dirty ? (
              <button
                type="button"
                onClick={() => {
                  const previous = JSON.parse(saved) as {
                    values: Values;
                    hours: Hours;
                  };
                  setValues(previous.values);
                  setHours(previous.hours);
                  setStatus({ kind: "idle" });
                }}
                className="rounded-full px-4 py-2.5 text-sm text-muted hover:text-mauve"
              >
                Annulla
              </button>
            ) : null}
            <button
              type="submit"
              disabled={!dirty || status.kind === "saving"}
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-[#3a2c2e] disabled:opacity-50"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
