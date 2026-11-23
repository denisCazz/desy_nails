import Link from "next/link";
import { and, asc, count, eq, gte, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookings, orders, services } from "@/lib/db/schema";
import { formatRomeDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const db = getDb();
  const [orderCount] = await db.select({ value: count() }).from(orders);
  const [bookingCount] = await db
    .select({ value: count() })
    .from(bookings)
    .where(and(eq(bookings.status, "pending"), gte(bookings.endAt, new Date())));
  const [serviceCount] = await db
    .select({ value: count() })
    .from(services)
    .where(eq(services.active, true));
  const upcoming = await db
    .select()
    .from(bookings)
    .where(and(ne(bookings.status, "cancelled"), gte(bookings.endAt, new Date())))
    .orderBy(asc(bookings.startAt))
    .limit(6);

  const cards = [
    { label: "Ordini", value: orderCount.value, href: "/admin/ordini" },
    { label: "Prenotazioni in attesa", value: bookingCount.value, href: "/admin/prenotazioni" },
    { label: "Servizi attivi", value: serviceCount.value, href: "/admin/servizi" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="gold-border rounded-2xl bg-surface p-6 hover:bg-blush/30">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 font-serif text-4xl text-gold">{card.value}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl text-mauve">Prossimi appuntamenti</h2>
          <Link href="/admin/prenotazioni" className="text-sm text-muted hover:text-mauve">
            Vedi tutti →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-muted">Nessun appuntamento in programma.</p>
        ) : (
          <ul className="gold-border divide-y divide-line rounded-2xl bg-surface">
            {upcoming.map((booking) => (
              <li key={booking.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="capitalize text-gold">
                  {formatRomeDate(booking.startAt, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="flex-1 px-2">
                  <strong>{booking.customerName}</strong> · {booking.serviceName}
                </span>
                {booking.status === "pending" ? (
                  <span className="rounded-full bg-gold/25 px-2 py-0.5 text-xs">In attesa</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
