"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useCart } from "./cart-provider";

export function CartCheckout({ onOrderSent }: { onOrderSent?: () => void }) {
  const cart = useCart();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      onOrderSent?.();
    } catch {
      setError("Ordine non inviato.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
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
                    aria-label={`Diminuisci ${item.name}`}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
                    aria-label={`Aumenta ${item.name}`}
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
    </>
  );
}
