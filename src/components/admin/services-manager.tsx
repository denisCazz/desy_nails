"use client";

import { useState } from "react";
import type { Service } from "@/lib/db/schema";
import { centsToEuroInput, formatPrice } from "@/lib/format";

function payloadFromForm(form: FormData) {
  return {
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
}

function ServiceFields({ service }: { service?: Service }) {
  return (
    <>
      <input
        required
        name="name"
        placeholder="Nome"
        defaultValue={service?.name}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2"
      />
      <select
        name="category"
        defaultValue={service?.category ?? "servizi"}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2"
      >
        <option value="servizi">Servizi</option>
        <option value="refill">Refill</option>
        <option value="extra">Extra</option>
      </select>
      <input
        name="price"
        type="number"
        step="0.01"
        placeholder="Prezzo €"
        defaultValue={centsToEuroInput(service?.priceCents)}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2"
      />
      <input
        name="duration"
        type="number"
        placeholder="Durata minuti"
        defaultValue={service?.durationMinutes ?? 60}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2"
      />
      <input
        name="priceNote"
        placeholder="Nota prezzo (es. ad unghia)"
        defaultValue={service?.priceNote}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2"
      />
      <textarea
        name="description"
        placeholder="Descrizione"
        defaultValue={service?.description}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="bookable" defaultChecked={service?.bookable ?? true} /> Prenotabile
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isAddon" defaultChecked={service?.isAddon} /> Extra / addon
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="priceFrom" defaultChecked={service?.priceFrom} /> Prezzo “da”
      </label>
    </>
  );
}

export function ServicesManager({ services }: { services: Service[] }) {
  const [rows, setRows] = useState(services);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload = payloadFromForm(new FormData(event.currentTarget));
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

  async function saveService(id: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload = payloadFromForm(new FormData(event.currentTarget));
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { service?: Service; error?: string };
    if (!res.ok || !data.service) {
      setError(data.error ?? "Impossibile salvare il servizio.");
      return;
    }
    setRows((current) => current.map((row) => (row.id === id ? data.service! : row)));
    setEditingId(null);
  }

  async function removeService(id: string) {
    if (!confirm("Rimuovere questo servizio?")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((current) => current.filter((row) => row.id !== id));
      if (editingId === id) setEditingId(null);
    }
  }

  async function toggleActive(service: Service) {
    const res = await fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !service.active }),
    });
    const data = (await res.json()) as { service?: Service };
    if (res.ok) {
      setRows((current) =>
        current.map((row) =>
          row.id === service.id ? (data.service ?? { ...row, active: !row.active }) : row,
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId((current) => (current === service.id ? null : service.id))}
                  className="rounded-full border border-line px-3 py-1 text-xs"
                >
                  {editingId === service.id ? "Annulla" : "Modifica"}
                </button>
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
            {editingId === service.id ? (
              <form onSubmit={(event) => saveService(service.id, event)} className="mt-4 space-y-3">
                <ServiceFields key={service.id} service={service} />
                <button type="submit" className="w-full rounded-full bg-gold py-2.5 text-[#3a2c2e]">
                  Salva modifiche
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>

      <form onSubmit={createService} className="gold-border h-fit space-y-3 rounded-2xl bg-surface p-5">
        <h3 className="font-serif text-2xl text-mauve">Nuovo servizio</h3>
        <ServiceFields />
        <button type="submit" className="w-full rounded-full bg-gold py-2.5 text-[#3a2c2e]">
          Aggiungi
        </button>
        {error ? <p className="text-sm text-rose">{error}</p> : null}
      </form>
    </div>
  );
}
