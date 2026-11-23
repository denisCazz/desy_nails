"use client";

import { useState } from "react";
import { DEFAULT_MIN_NOTICE_HOURS } from "@/lib/booking-rules";

export function SettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const [message, setMessage] = useState("");
  const hours = JSON.parse(settings.working_hours || "{}") as Record<
    string,
    { start: string; end: string }[]
  >;
  const days = [
    ["1", "Lunedì"],
    ["2", "Martedì"],
    ["3", "Mercoledì"],
    ["4", "Giovedì"],
    ["5", "Venerdì"],
    ["6", "Sabato"],
    ["0", "Domenica"],
  ];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const workingHours: Record<string, { start: string; end: string }[]> = {};
    for (const [key] of days) {
      const closed = form.get(`closed-${key}`) === "on";
      workingHours[key] = closed
        ? []
        : [{ start: String(form.get(`start-${key}`)), end: String(form.get(`end-${key}`)) }];
    }
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: String(form.get("phone") ?? ""),
        address: String(form.get("address") ?? ""),
        instagram: String(form.get("instagram") ?? ""),
        caldav_url: String(form.get("caldav_url") ?? ""),
        caldav_username: String(form.get("caldav_username") ?? ""),
        caldav_password: String(form.get("caldav_password") ?? ""),
        caldav_calendar_url: String(form.get("caldav_calendar_url") ?? ""),
        working_hours: JSON.stringify(workingHours),
        min_notice_hours: String(form.get("min_notice_hours") ?? ""),
        buffer_minutes: String(form.get("buffer_minutes") ?? ""),
      }),
    });
    setMessage(res.ok ? "Salvato." : "Salvataggio non riuscito.");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-2">
      <section className="gold-border space-y-3 rounded-2xl bg-surface p-5">
        <h3 className="font-serif text-xl text-mauve">Studio</h3>
        <input
          name="phone"
          defaultValue={settings.phone}
          placeholder="Telefono"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
        <input
          name="address"
          defaultValue={settings.address}
          placeholder="Indirizzo"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
        <input
          name="instagram"
          defaultValue={settings.instagram}
          placeholder="@__desy.nails__"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
      </section>

      <section className="gold-border space-y-3 rounded-2xl bg-surface p-5">
        <h3 className="font-serif text-xl text-mauve">CalDAV iCloud / iPhone</h3>
        <p className="text-sm text-muted">
          Server iCloud: https://caldav.icloud.com — username: Apple ID — password: password per
          app. Così gli eventi creati sul telefono diventano slot occupati sul sito.
        </p>
        <input
          name="caldav_url"
          defaultValue={settings.caldav_url}
          placeholder="https://caldav.icloud.com"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
        <input
          name="caldav_username"
          defaultValue={settings.caldav_username}
          placeholder="Apple ID"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
        <input
          type="password"
          name="caldav_password"
          defaultValue={settings.caldav_password}
          placeholder="Password per app"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
        <input
          name="caldav_calendar_url"
          defaultValue={settings.caldav_calendar_url}
          placeholder="URL calendario (opzionale)"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
      </section>

      <section className="gold-border space-y-3 rounded-2xl bg-surface p-5 lg:col-span-2">
        <h3 className="font-serif text-xl text-mauve">Regole di prenotazione</h3>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <label className="flex items-center justify-between gap-3">
            <span>
              Preavviso minimo (ore)
              <span className="block text-xs text-muted">
                Le clienti non possono prenotare un orario che inizia prima di queste ore.
              </span>
            </span>
            <input
              type="number"
              name="min_notice_hours"
              min={0}
              max={336}
              step={1}
              defaultValue={settings.min_notice_hours ?? String(DEFAULT_MIN_NOTICE_HOURS)}
              className="w-24 rounded-lg border border-line bg-paper px-2 py-1"
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>
              Pausa tra appuntamenti (minuti)
              <span className="block text-xs text-muted">
                Tempo libero lasciato dopo ogni appuntamento prima del successivo.
              </span>
            </span>
            <input
              type="number"
              name="buffer_minutes"
              min={0}
              max={120}
              step={5}
              defaultValue={settings.buffer_minutes ?? "0"}
              className="w-24 rounded-lg border border-line bg-paper px-2 py-1"
            />
          </label>
        </div>
      </section>

      <section className="gold-border space-y-3 rounded-2xl bg-surface p-5 lg:col-span-2">
        <h3 className="font-serif text-xl text-mauve">Orari di lavoro</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {days.map(([key, label]) => {
            const window = hours[key]?.[0];
            const closed = !window;
            return (
              <label key={key} className="grid grid-cols-[7rem_1fr_1fr_auto] items-center gap-2 text-sm">
                <span>{label}</span>
                <input
                  type="time"
                  name={`start-${key}`}
                  defaultValue={window?.start ?? "09:30"}
                  className="rounded-lg border border-line bg-paper px-2 py-1"
                />
                <input
                  type="time"
                  name={`end-${key}`}
                  defaultValue={window?.end ?? "19:00"}
                  className="rounded-lg border border-line bg-paper px-2 py-1"
                />
                <span className="flex items-center gap-1">
                  <input type="checkbox" name={`closed-${key}`} defaultChecked={closed} />
                  chiuso
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <button className="rounded-full bg-gold px-6 py-3 text-[#3a2c2e] lg:col-span-2">
        Salva impostazioni
      </button>
      {message ? <p className="text-mauve">{message}</p> : null}
    </form>
  );
}
