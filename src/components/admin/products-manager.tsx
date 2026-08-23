"use client";

import { useState } from "react";
import type { Product } from "@/lib/db/schema";
import { centsToEuroInput, formatPrice } from "@/lib/format";
import { parseColors } from "../nail-set-preview";
import { ProductMedia } from "../product-media";
import { AdminDialog } from "./admin-dialog";
import { ColorPickerList } from "./color-picker-list";

async function uploadImage(file: File | null, previousUrl = "") {
  if (!file || file.size === 0) return previousUrl;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload non riuscito.");
  }
  return data.url;
}

function payloadFromForm(form: FormData, imageUrl: string) {
  return {
    name: String(form.get("name") ?? ""),
    description: String(form.get("description") ?? ""),
    priceEuros: String(form.get("price") ?? ""),
    shape: String(form.get("shape") ?? "almond"),
    length: String(form.get("length") ?? "M"),
    colors: String(form.get("colors") ?? ""),
    imageUrl,
  };
}

function ImageField({ currentUrl }: { currentUrl?: string }) {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {preview || currentUrl ? (
        <img
          src={preview || currentUrl}
          alt=""
          className="h-36 w-full rounded-xl object-cover"
        />
      ) : null}
      <input
        type="file"
        name="image"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
        }}
        className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-[#3a2c2e]"
      />
      {currentUrl && !preview ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="removeImage" /> Rimuovi immagine
        </label>
      ) : null}
    </div>
  );
}

function ProductFields({ product }: { product?: Product }) {
  return (
    <>
      <input
        required
        name="name"
        placeholder="Nome"
        defaultValue={product?.name}
        className="w-full rounded-xl border border-line bg-paper px-3 py-3"
      />
      <textarea
        name="description"
        placeholder="Descrizione"
        defaultValue={product?.description}
        className="w-full rounded-xl border border-line bg-paper px-3 py-3"
      />
      <input
        name="price"
        type="number"
        step="0.01"
        required
        placeholder="Prezzo €"
        defaultValue={centsToEuroInput(product?.priceCents)}
        className="w-full rounded-xl border border-line bg-paper px-3 py-3"
      />
      <select
        name="shape"
        defaultValue={product?.shape ?? "almond"}
        className="w-full rounded-xl border border-line bg-paper px-3 py-3"
      >
        <option value="almond">Mandorla</option>
        <option value="coffin">Ballerina</option>
        <option value="square">Quadrata</option>
        <option value="stiletto">Stiletto</option>
      </select>
      <select
        name="length"
        defaultValue={product?.length ?? "M"}
        className="w-full rounded-xl border border-line bg-paper px-3 py-3"
      >
        <option value="S">S</option>
        <option value="M">M</option>
        <option value="L">L</option>
      </select>
      <ColorPickerList defaultColors={product ? parseColors(product.colors) : undefined} />
      <ImageField currentUrl={product?.imageUrl || undefined} />
    </>
  );
}

export function ProductsManager({ products }: { products: Product[] }) {
  const [rows, setRows] = useState(products);
  const [dialog, setDialog] = useState<"create" | Product | null>(null);
  const [error, setError] = useState("");

  function closeDialog() {
    setDialog(null);
    setError("");
  }

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const imageUrl = await uploadImage(data.get("image") as File | null);
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromForm(data, imageUrl)),
      });
      const json = (await res.json()) as { product?: Product; error?: string };
      if (!res.ok || !json.product) {
        setError(json.error ?? "Impossibile aggiungere il set.");
        return;
      }
      setRows((current) => [...current, json.product!]);
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile aggiungere il set.");
    }
  }

  async function saveProduct(product: Product, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const uploaded = await uploadImage(data.get("image") as File | null, product.imageUrl);
      const imageUrl = data.get("removeImage") === "on" && !(data.get("image") as File)?.size ? "" : uploaded;
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromForm(data, imageUrl)),
      });
      const json = (await res.json()) as { product?: Product; error?: string };
      if (!res.ok || !json.product) {
        setError(json.error ?? "Impossibile salvare il set.");
        return;
      }
      setRows((current) => current.map((row) => (row.id === product.id ? json.product! : row)));
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile salvare il set.");
    }
  }

  async function removeProduct(id: string) {
    if (!confirm("Rimuovere questo set dallo shop?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((current) => current.filter((row) => row.id !== id));
      if (typeof dialog !== "string" && dialog?.id === id) closeDialog();
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
          Nuovo set
        </button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {rows.map((product) => (
          <li key={product.id} className="gold-border overflow-hidden rounded-2xl bg-surface">
            <ProductMedia product={product} />
            <div className="space-y-2 p-4">
              <p className="font-serif text-xl text-mauve">{product.name}</p>
              <p className="text-base text-gold">{formatPrice(product.priceCents)}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setDialog(product);
                  }}
                  className="rounded-full border border-line px-3 py-1 text-sm"
                >
                  Modifica
                </button>
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="rounded-full border border-rose/40 px-3 py-1 text-sm text-rose"
                >
                  Rimuovi
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {dialog === "create" ? (
        <AdminDialog title="Nuovo set" onClose={closeDialog}>
          <form onSubmit={createProduct} className="space-y-3">
            <ProductFields />
            <button type="submit" className="w-full rounded-full bg-gold py-3 text-[#3a2c2e]">
              Aggiungi set
            </button>
            {error ? <p className="text-base text-rose">{error}</p> : null}
          </form>
        </AdminDialog>
      ) : null}

      {editing ? (
        <AdminDialog title="Modifica set" onClose={closeDialog}>
          <form onSubmit={(event) => saveProduct(editing, event)} className="space-y-3">
            <ProductFields key={editing.id} product={editing} />
            <button type="submit" className="w-full rounded-full bg-gold py-2.5 text-[#3a2c2e]">
              Salva modifiche
            </button>
            {error ? <p className="text-base text-rose">{error}</p> : null}
          </form>
        </AdminDialog>
      ) : null}
    </div>
  );
}
