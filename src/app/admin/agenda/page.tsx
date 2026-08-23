import { gte } from "drizzle-orm";
import { AgendaBoard } from "@/components/admin/agenda-board";
import { getDb } from "@/lib/db";
import { blockedSlots, bookings } from "@/lib/db/schema";
import { getStudioConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminAgendaPage() {
  const db = getDb();
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const [rows, blocks, config] = await Promise.all([
    db.select().from(bookings).where(gte(bookings.endAt, from)),
    db.select().from(blockedSlots).where(gte(blockedSlots.endAt, from)),
    getStudioConfig(),
  ]);
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const calendarUrl = `${appUrl}/api/calendar/${config.calendarToken}`;

  return (
    <div>
      <h2 className="mb-6 font-serif text-3xl text-mauve">Agenda</h2>
      <AgendaBoard bookings={rows} blocks={blocks} calendarUrl={calendarUrl} />
    </div>
  );
}
