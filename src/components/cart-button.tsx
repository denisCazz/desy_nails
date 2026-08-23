"use client";

import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { itemCount, pulseId, isOpen, toggleCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!pulseId) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? 0 : 420;
    setBouncing(false);
    const start = window.setTimeout(() => setBouncing(true), delay);
    const stop = window.setTimeout(() => setBouncing(false), delay + 700);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [pulseId]);

  const count = mounted ? itemCount : 0;
  const label =
    count === 0
      ? "Apri il carrello"
      : count === 1
        ? "Apri il carrello, 1 articolo"
        : `Apri il carrello, ${count} articoli`;

  return (
    <button
      type="button"
      data-cart-target
      aria-label={label}
      aria-expanded={isOpen}
      aria-controls="cart-drawer"
      onClick={toggleCart}
      className={`relative inline-flex size-9 items-center justify-center rounded-full border text-mauve transition hover:border-gold hover:text-gold ${
        count > 0 || isOpen ? "border-gold bg-gold/15 text-gold" : "border-line"
      } ${bouncing ? "cart-bounce" : ""}`}
    >
      <ShoppingBag className="size-4" />
      {count > 0 ? (
        <span key={`${count}-${pulseId}`} className="cart-badge">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
