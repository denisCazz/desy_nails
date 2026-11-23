"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { INSTAGRAM_URL } from "@/lib/brand";
import { useEffect, useState } from "react";
import { CartButton } from "./cart-button";
import { GoldDivider } from "./gold-divider";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/chi-sono", label: "Chi sono" },
  { href: "/servizi", label: "Servizi" },
  { href: "/prenota", label: "Prenota" },
  { href: "/shop", label: "Shop" },
  { href: "/regolamento", label: "Regolamento" },
];

function InstagramIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide transition ${
                  pathname === link.href
                    ? "text-gold"
                    : "text-muted hover:text-mauve"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-full border border-line text-mauve hover:border-gold hover:text-gold"
              aria-label="Instagram Desy Nails"
            >
              <InstagramIcon />
            </a>
            <CartButton />
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full border border-line text-mauve md:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Chiudi il menu" : "Apri il menu"}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </header>
      {open ? (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="menu-overlay fixed inset-0 z-50 flex h-dvh flex-col bg-paper md:hidden"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
              <Logo />
            </Link>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full border border-line text-mauve"
              onClick={() => setOpen(false)}
              aria-label="Chiudi il menu"
            >
              <X className="size-4" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col items-center justify-center px-6">
            <GoldDivider className="mb-8 w-40" />
            {links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${80 + index * 55}ms` }}
                className={`menu-link py-2.5 font-serif text-3xl tracking-wide transition sm:text-4xl ${
                  pathname === link.href ? "text-gold" : "text-mauve hover:text-gold"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <GoldDivider className="mt-8 w-40" />
          </nav>
          <div className="flex flex-col items-center gap-4 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm tracking-wide text-muted hover:text-gold"
            >
              <InstagramIcon className="size-4" />
              Instagram
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
