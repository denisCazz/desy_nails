"use client";

import { useState } from "react";
import type { Order, OrderItem } from "@/lib/db/schema";
import { formatPrice } from "@/lib/format";
import { formatRomeDate } from "@/lib/time";

type OrderRow = Order & { items: OrderItem[] };

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [rows, setRows] = useState(orders);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, status } : row)),
      );
    }
  }

  if (rows.length === 0) {
    return <p className="text-muted">Nessun ordine per ora.</p>;
  }

  return (
    <div className="space-y-4">
      {rows.map((order) => (
        <article key={order.id} className="gold-border rounded-2xl bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl text-mauve">{order.customerName}</h3>
              <p className="text-sm text-muted">
                {order.email}
                {order.phone ? ` · ${order.phone}` : ""}
              </p>
              <p className="text-xs text-muted">
                {formatRomeDate(new Date(order.createdAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-serif text-xl text-gold">{formatPrice(order.totalCents)}</p>
              <select
                value={order.status}
                onChange={(event) => updateStatus(order.id, event.target.value)}
                className="mt-2 rounded-lg border border-line bg-paper px-2 py-1 text-sm"
              >
                <option value="new">Nuovo</option>
                <option value="confirmed">Confermato</option>
                <option value="done">Completato</option>
                <option value="cancelled">Annullato</option>
              </select>
            </div>
          </div>
          <ul className="mt-4 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-1">
                <span>
                  {item.quantity}× {item.serviceName}
                  {item.extraNote ? ` (${item.extraNote})` : ""}
                </span>
                <span>{formatPrice(item.unitPriceCents * item.quantity)}</span>
              </li>
            ))}
          </ul>
          {order.notes ? <p className="mt-3 text-sm text-muted">Note: {order.notes}</p> : null}
        </article>
      ))}
    </div>
  );
}
