"use client";

import { useState } from "react";
import type { Service } from "@/lib/db/schema";
import { centsToEuroInput, formatPrice } from "@/lib/format";
import { AdminDialog } from "./admin-dialog";

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
  const [dialog, setDialog] = useState<"create" | Service | null>(null);
  const [error, setError] = useState("");

  function closeDialog() {
    setDialog(null);
    setError("");
  }

  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadFromForm(new FormData(event.currentTarget))),
    });
    const data = (await res.json()) as { service?: Service; error?: string };
    if (!res.ok || !data.service) {
      setError(data.error ?? "Impossibile aggiungere il servizio.");
      return;
    }
    setRows((current) => [...current, data.service!].sort((a, b) => a.sortOrder - b.sortOrder));
    closeDialog();
  }

  async function saveService(id: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadFromForm(new FormData(event.currentTarget))),
    });
    const data = (await res.json()) as { service?: Service; error?: string };
    if (!res.ok || !data.service) {
      setError(data.error ?? "Impossibile salvare il servizio.");
      return;
    }
    setRows((current) => current.map((row) => (row.id === id ? data.service! : row)));
    closeDialog();
  }

  async function removeService(id: string) {
    if (!confirm("Rimuovere questo servizio?")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((current) => current.filter((row) => row.id !== id));
      if (typeof dialog !== "string" && dialog?.id === id) closeDialog();
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

  const editing = dialog && dialog !== "create" ? dialog : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setError("");
            setDialog("create");
          }}
          className="rounded-full bg-gold px-5 py-2.5 text-[#3a2c2e]"
        >
          Nuovo servizio
        </button>
      </div>

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
                  onClick={() => {
                    setError("");
                    setDialog(service);
                  }}
                  className="rounded-full border border-line px-3 py-1 text-xs"
                >
                  Modifica
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
          </li>
        ))}
      </ul>

      {dialog === "create" ? (
        <AdminDialog title="Nuovo servizio" onClose={closeDialog}>
          <form onSubmit={createService} className="space-y-3">
            <ServiceFields />
            <button type="submit" className="w-full rounded-full bg-gold py-2.5 text-[#3a2c2e]">
              Aggiungi
            </button>
            {error ? <p className="text-sm text-rose">{error}</p> : null}
          </form>
        </AdminDialog>
      ) : null}

      {editing ? (
        <AdminDialog title="Modifica servizio" onClose={closeDialog}>
          <form onSubmit={(event) => saveService(editing.id, event)} className="space-y-3">
            <ServiceFields key={editing.id} service={editing} />
            <button type="submit" className="w-full rounded-full bg-gold py-2.5 text-[#3a2c2e]">
              Salva modifiche
            </button>
            {error ? <p className="text-sm text-rose">{error}</p> : null}
          </form>
        </AdminDialog>
      ) : null}
    </div>
  );
}
