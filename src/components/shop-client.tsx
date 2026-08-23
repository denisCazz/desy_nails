"use client";

import { Check } from "lucide-react";
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
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!justAddedId) return;
    const timer = window.setTimeout(() => setJustAddedId(null), 1400);
    return () => window.clearTimeout(timer);
  }, [justAddedId, cart.pulseId]);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}
