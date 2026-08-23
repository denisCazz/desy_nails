"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/db/schema";
import { useCart } from "./cart-provider";
import { ProductMedia } from "./product-media";

const shapeLabel: Record<string, string> = {
  almond: "Mandorla",
  coffin: "Ballerina",
  square: "Quadrata",
  stiletto: "Stiletto",
};

export function ShopClient({ products }: { products: Product[] }) {
  const cart = useCart();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [panelPulse, setPanelPulse] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!justAddedId) return;
    const timer = window.setTimeout(() => setJustAddedId(null), 1400);
    return () => window.clearTimeout(timer);
  }, [justAddedId, cart.pulseId]);

  useEffect(() => {
    if (!cart.pulseId) return;
    setPanelPulse(true);
    const timer = window.setTimeout(() => setPanelPulse(false), 800);
    return () => window.clearTimeout(timer);
  }, [cart.pulseId]);

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: String(form.get("customerName") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          notes: String(form.get("notes") ?? ""),
          items: cart.items,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Ordine non inviato.");
        return;
      }
      cart.clear();
      setMessage("Ordine inviato. Ti risponderò via email per confermare disponibilità e misura.");
      formEl.reset();
    } catch {
      setError("Ordine non inviato.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="grid gap-6 sm:grid-cols-2">
        {products.map((product) => (
          <article key={product.id} className="gold-border overflow-hidden rounded-3xl bg-surface">
            <ProductMedia product={product} className="h-52" />
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-xl text-mauve">{product.name}</h3>
                <p className="shrink-0 font-serif text-xl text-gold">
                  {formatPrice(product.priceCents)}
                </p>
              </div>
              <p className="text-sm text-muted">{product.description}</p>
              <p className="text-sm text-muted">
                Forma {shapeLabel[product.shape] ?? product.shape} · lunghezza {product.length}
              </p>
              <button
                type="button"
                onClick={(event) => {
                  cart.add(
                    {
                      productId: product.id,
                      name: product.name,
                      unitPriceCents: product.priceCents,
                      quantity: 1,
                      extraNote: `${shapeLabel[product.shape] ?? product.shape} ${product.length}`,
                    },
                    event.currentTarget,
                  );
                  setJustAddedId(product.id);
                }}
                className={`w-full rounded-full border px-4 py-2 text-sm transition ${
                  justAddedId === product.id
                    ? "border-gold bg-gold text-[#3a2c2e]"
                    : "border-gold text-mauve hover:bg-gold hover:text-[#3a2c2e]"
                }`}
              >
                {justAddedId === product.id ? (
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Check className="size-4" />
                    Aggiunto al carrello
                  </span>
                ) : (
                  "Aggiungi al carrello"
                )}
              </button>
            </div>
          </article>
        ))}
      </div>

      <aside
        id="carrello"
        className={`gold-border h-fit scroll-mt-24 rounded-3xl bg-surface p-6 lg:sticky lg:top-24 ${
          panelPulse ? "cart-panel-pulse" : ""
        }`}
      >
        <h2 className="flex items-center gap-2 font-serif text-2xl text-mauve">
          <ShoppingBag className={`size-5 ${panelPulse ? "cart-bounce" : ""}`} />
          Il tuo ordine
        </h2>
        {cart.items.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nessun set nel carrello.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <p>{item.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-gold">
                  {formatPrice(item.unitPriceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 font-serif text-xl text-gold">
          Totale {formatPrice(cart.totalCents)}
        </p>
        <form onSubmit={checkout} className="mt-5 grid gap-3">
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
            rows={3}
            placeholder="Misura, forma o note per Desiree"
            className="rounded-xl border border-line bg-paper px-3 py-2"
          />
          <button
            type="submit"
            disabled={cart.items.length === 0 || submitting}
            className="rounded-full bg-gold py-3 font-medium text-[#3a2c2e] disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <ShoppingBag className="size-4 cart-bounce-loop" />
                Invio ordine…
              </span>
            ) : (
              "Invia ordine via email"
            )}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-700 dark:text-rose">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-mauve">{message}</p> : null}
      </aside>
    </div>
  );
}
