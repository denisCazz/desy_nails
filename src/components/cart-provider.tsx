"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ShoppingBag } from "lucide-react";

export type CartItem = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  extraNote?: string;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem, origin?: HTMLElement | null) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalCents: number;
  itemCount: number;
  pulseId: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

type FlyParticle = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "desy-cart-v2";

let flySeq = 0;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function spawnFly(
  origin: HTMLElement,
  setFlies: Dispatch<SetStateAction<FlyParticle[]>>,
) {
  if (prefersReducedMotion()) return;
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target) return;
  const from = origin.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const x = from.left + from.width / 2;
  const y = from.top + from.height / 2;
  const id = ++flySeq;
  setFlies((current) => [
    ...current,
    {
      id,
      x,
      y,
      dx: to.left + to.width / 2 - x,
      dy: to.top + to.height / 2 - y,
    },
  ]);
  window.setTimeout(() => {
    setFlies((current) => current.filter((particle) => particle.id !== id));
  }, 700);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [pulseId, setPulseId] = useState(0);
  const [flies, setFlies] = useState<FlyParticle[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((open) => !open), []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setItems(JSON.parse(raw) as CartItem[]);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => {
    const add = (item: CartItem, origin?: HTMLElement | null) => {
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
      setPulseId((current) => current + 1);
      if (origin) spawnFly(origin, setFlies);
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
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      items,
      add,
      remove,
      setQuantity,
      clear,
      totalCents,
      itemCount,
      pulseId,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
    };
  }, [items, pulseId, isOpen, openCart, closeCart, toggleCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {flies.map((particle) => (
        <span
          key={particle.id}
          className="cart-fly"
          style={
            {
              left: particle.x,
              top: particle.y,
              "--dx": `${particle.dx}px`,
              "--dy": `${particle.dy}px`,
            } as CSSProperties
          }
          aria-hidden
        >
          <ShoppingBag className="size-4" />
        </span>
      ))}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("CartProvider mancante");
  return ctx;
}
