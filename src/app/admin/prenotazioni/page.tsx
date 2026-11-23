import { asc, gte } from "drizzle-orm";
import { BookingsList } from "@/components/admin/bookings-list";
import { PrintButton } from "@/components/admin/print-button";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { addMinutes } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const from = addMinutes(new Date(), -90 * 24 * 60);
  const rows = await getDb()
    .select()
    .from(bookings)
    .where(gte(bookings.endAt, from))
    .orderBy(asc(bookings.startAt));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-3xl text-mauve">Appuntamenti</h2>
        <PrintButton label="Stampa elenco" />
      </div>
      <BookingsList bookings={rows} />
    </div>
  );
}
