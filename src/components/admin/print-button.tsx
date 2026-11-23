"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Stampa" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-medium text-[#3a2c2e] print:hidden"
    >
      <Printer className="size-4" />
      {label}
    </button>
  );
}
