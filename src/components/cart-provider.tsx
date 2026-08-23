"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  extraNote?: string;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "desy-cart-v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setItems(JSON.parse(raw) as CartItem[]);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const add = (item: CartItem) => {
      setItems((current) => {
        const existing = current.find((row) => row.productId === item.productId);
        if (existing) {
          return current.map((row) =>
            row.productId === item.productId
              ? { ...row, quantity: row.quantity + item.quantity }
              : row,
          );
        }
        return [...current, item];
      });
    };
    const remove = (productId: string) =>
      setItems((current) => current.filter((row) => row.productId !== productId));
    const setQuantity = (productId: string, quantity: number) =>
      setItems((current) =>
        current
          .map((row) => (row.productId === productId ? { ...row, quantity } : row))
          .filter((row) => row.quantity > 0),
      );
    const clear = () => setItems([]);
    const totalCents = items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0,
    );
    return { items, add, remove, setQuantity, clear, totalCents };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("CartProvider mancante");
  return ctx;
}
