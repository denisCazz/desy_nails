"use client";

import { useState } from "react";
import type { Service } from "@/lib/db/schema";
import { formatPrice } from "@/lib/format";

export function ServicesManager({ services }: { services: Service[] }) {
  const [rows, setRows] = useState(services);
  const [error, setError] = useState("");

  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      category: String(form.get("category") ?? "servizi"),
      priceEuros: String(form.get("price") ?? ""),
      durationMinutes: Number(form.get("duration") ?? 60),
      bookable: form.get("bookable") === "on",
      isAddon: form.get("isAddon") === "on",
      priceFrom: form.get("priceFrom") === "on",
      priceNote: String(form.get("priceNote") ?? ""),
      description: String(form.get("description") ?? ""),
    };
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { service?: Service; error?: string };
    if (!res.ok || !data.service) {
      setError(data.error ?? "Impossibile aggiungere il servizio.");
      return;
    }
    setRows((current) => [...current, data.service!].sort((a, b) => a.sortOrder - b.sortOrder));
    event.currentTarget.reset();
  }

  async function removeService(id: string) {
    if (!confirm("Rimuovere questo servizio?")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) setRows((current) => current.filter((row) => row.id !== id));
  }

  async function toggleActive(service: Service) {
    const res = await fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !service.active }),
    });
    if (res.ok) {
      setRows((current) =>
        current.map((row) =>
          row.id === service.id ? { ...row, active: !row.active } : row,
        ),
      );
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
      <ul className="space-y-3">
        {rows.map((service) => (
          <li key={service.id} className="gold-border rounded-2xl bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted">
                  {service.category} · {formatPrice(service.priceCents, {
                    from: service.priceFrom,
                    note: service.priceNote || undefined,
                  })}{" "}
                  · {service.durationMinutes} min
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(service)}
                  className="rounded-full border border-line px-3 py-1 text-xs"
                >
                  {service.active ? "Nascondi" : "Mostra"}
                </button>
                <button
                  type="button"
                  onClick={() => removeService(service.id)}
                  className="rounded-full border border-rose/40 px-3 py-1 text-xs text-rose"
                >
                  Rimuovi
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={createService} className="gold-border h-fit space-y-3 rounded-2xl bg-surface p-5">
        <h3 className="font-serif text-2xl text-mauve">Nuovo servizio</h3>
        <input
          required
          name="name"
          placeholder="Nome"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
        <select name="category" className="w-full rounded-xl border border-line bg-paper px-3 py-2">
          <option value="servizi">Servizi</option>
          <option value="refill">Refill</option>
          <option value="extra">Extra</option>
        </select>
        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="Prezzo €"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
        <input
          name="duration"
          type="number"
          defaultValue={60}
          placeholder="Durata minuti"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
        <input
          name="priceNote"
          placeholder="Nota prezzo (es. ad unghia)"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
        <textarea
          name="description"
          placeholder="Descrizione"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="bookable" defaultChecked /> Prenotabile
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isAddon" /> Extra / addon
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="priceFrom" /> Prezzo “da”
        </label>
        <button type="submit" className="w-full rounded-full bg-gold py-2.5 text-[#3a2c2e]">
          Aggiungi
        </button>
        {error ? <p className="text-sm text-rose">{error}</p> : null}
      </form>
    </div>
  );
}
