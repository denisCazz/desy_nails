"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Printer,
  Scissors,
  Settings,
  ShoppingBag,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/prenotazioni", label: "Appuntamenti", icon: CalendarCheck },
  { href: "/admin/disponibilita", label: "Disponibilità", icon: Printer },
  { href: "/admin/ordini", label: "Ordini", icon: ListOrdered },
  { href: "/admin/servizi", label: "Servizi", icon: Scissors },
  { href: "/admin/prodotti", label: "Shop", icon: ShoppingBag },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/impostazioni", label: "Impostazioni", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-auto border-b border-line pb-3 md:flex-col md:border-b-0 md:border-r md:pr-6 print:hidden">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
            pathname === link.href ? "bg-blush/50 text-mauve" : "text-muted hover:text-mauve"
          }`}
        >
          <link.icon className="size-4" />
          {link.label}
        </Link>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted hover:text-mauve"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/admin/login";
        }}
      >
        <LogOut className="size-4" />
        Esci
      </button>
    </nav>
  );
}
