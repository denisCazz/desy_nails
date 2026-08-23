"use client";

import { ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";
import { CartCheckout } from "./cart-checkout";
import { useCart } from "./cart-provider";

export function CartDrawer() {
  const { isOpen, closeCart, itemCount } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="cart-drawer-overlay absolute inset-0 bg-black/45"
        aria-label="Chiudi il carrello"
        onClick={closeCart}
      />
      <aside
        id="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="cart-drawer-panel gold-border absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2
            id="cart-drawer-title"
            className="flex items-center gap-2 font-serif text-2xl text-mauve"
          >
            <ShoppingBag className="size-5" />
            Il tuo carrello
            {itemCount > 0 ? (
              <span className="rounded-full bg-gold px-2 py-0.5 font-sans text-xs font-medium text-[#3a2c2e]">
                {itemCount}
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="inline-flex size-9 items-center justify-center rounded-full border border-line text-mauve hover:border-gold hover:text-gold"
            aria-label="Chiudi il carrello"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <CartCheckout />
        </div>
      </aside>
    </div>
  );
}
