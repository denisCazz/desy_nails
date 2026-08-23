"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { itemCount, pulseId } = useCart();
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
      ? "Carrello, vai allo shop"
      : count === 1
        ? "Carrello, 1 articolo"
        : `Carrello, ${count} articoli`;

  return (
    <Link
      href="/shop#carrello"
      data-cart-target
      aria-label={label}
      className={`relative inline-flex size-9 items-center justify-center rounded-full border text-mauve transition hover:border-gold hover:text-gold ${
        count > 0 ? "border-gold bg-gold/15 text-gold" : "border-line"
      } ${bouncing ? "cart-bounce" : ""}`}
    >
      <ShoppingBag className="size-4" />
      {count > 0 ? (
        <span key={`${count}-${pulseId}`} className="cart-badge">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
