"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return children;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs tracking-[0.3em] uppercase text-gold">Pannello</p>
        <h1 className="font-serif text-4xl text-mauve">Studio</h1>
      </div>
      <div className="grid gap-8 md:grid-cols-[14rem_1fr]">
        <AdminNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
