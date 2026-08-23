"use client";

import { useState } from "react";
import type { Product } from "@/lib/db/schema";
import { formatPrice } from "@/lib/format";
import { NailSetPreview, parseColors } from "../nail-set-preview";

export function ProductsManager({ products }: { products: Product[] }) {
  const [rows, setRows] = useState(products);
  const [error, setError] = useState("");

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? ""),
        priceEuros: String(form.get("price") ?? ""),
        shape: String(form.get("shape") ?? "almond"),
        length: String(form.get("length") ?? "M"),
        colors: String(form.get("colors") ?? ""),
      }),
    });
    const data = (await res.json()) as { product?: Product; error?: string };
    if (!res.ok || !data.product) {
      setError(data.error ?? "Impossibile aggiungere il set.");
      return;
    }
    setRows((current) => [...current, data.product!]);
    event.currentTarget.reset();
  }

  async function removeProduct(id: string) {
    if (!confirm("Rimuovere questo set dallo shop?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) setRows((current) => current.filter((row) => row.id !== id));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
      <ul className="grid gap-4 sm:grid-cols-2">
        {rows.map((product) => (
          <li key={product.id} className="gold-border overflow-hidden rounded-2xl bg-surface">
            <NailSetPreview colors={parseColors(product.colors)} shape={product.shape} />
            <div className="space-y-2 p-4">
              <p className="font-serif text-xl text-mauve">{product.name}</p>
              <p className="text-base text-gold">{formatPrice(product.priceCents)}</p>
              <button
                type="button"
                onClick={() => removeProduct(product.id)}
                className="rounded-full border border-rose/40 px-3 py-1 text-sm text-rose"
              >
                Rimuovi
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={createProduct} className="gold-border h-fit space-y-3 rounded-2xl bg-surface p-5">
        <h3 className="font-serif text-2xl text-mauve">Nuovo set</h3>
        <input
          required
          name="name"
          placeholder="Nome"
          className="w-full rounded-xl border border-line bg-paper px-3 py-3"
        />
        <textarea
          name="description"
          placeholder="Descrizione"
          className="w-full rounded-xl border border-line bg-paper px-3 py-3"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          required
          placeholder="Prezzo €"
          className="w-full rounded-xl border border-line bg-paper px-3 py-3"
        />
        <select name="shape" className="w-full rounded-xl border border-line bg-paper px-3 py-3">
          <option value="almond">Mandorla</option>
          <option value="coffin">Ballerina</option>
          <option value="square">Quadrata</option>
          <option value="stiletto">Stiletto</option>
        </select>
        <select name="length" className="w-full rounded-xl border border-line bg-paper px-3 py-3">
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
        </select>
        <input
          name="colors"
          placeholder="#f3d5cc, #e8c4b8, #ffffff"
          className="w-full rounded-xl border border-line bg-paper px-3 py-3"
        />
        <button type="submit" className="w-full rounded-full bg-gold py-3 text-[#3a2c2e]">
          Aggiungi set
        </button>
        {error ? <p className="text-base text-rose">{error}</p> : null}
      </form>
    </div>
  );
}
