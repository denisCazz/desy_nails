import { count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookings, orders, services } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const db = getDb();
  const [orderCount] = await db.select({ value: count() }).from(orders);
  const [bookingCount] = await db
    .select({ value: count() })
    .from(bookings)
    .where(eq(bookings.status, "pending"));
  const [serviceCount] = await db
    .select({ value: count() })
    .from(services)
    .where(eq(services.active, true));

  const cards = [
    { label: "Ordini", value: orderCount.value },
    { label: "Prenotazioni in attesa", value: bookingCount.value },
    { label: "Servizi attivi", value: serviceCount.value },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="gold-border rounded-2xl bg-surface p-6">
          <p className="text-sm text-muted">{card.label}</p>
          <p className="mt-2 font-serif text-4xl text-gold">{card.value}</p>
        </article>
      ))}
    </div>
  );
}
