import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { isSlotFree } from "@/lib/availability";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { sendBookingUpdateEmail } from "@/lib/email";
import { fromRomeLocal } from "@/lib/time";
import { normalizePhone } from "@/lib/validation";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

const schema = z.object({
  status: z.enum(STATUSES).optional(),
  firstName: z.string().trim().min(1).max(120).optional(),
  lastName: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().max(255).pipe(z.union([z.literal(""), z.email()])).optional(),
  phone: z.string().trim().max(64).optional(),
  serviceName: z.string().trim().min(1).max(255).optional(),
  notes: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  force: z.boolean().optional(),
  notify: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/bookings/[id]">,
) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const { id } = await context.params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
  const data = parsed.data;

  const db = getDb();
  const [current] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!current) return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 });

  const update: Partial<typeof bookings.$inferInsert> = {};
  if (data.status) update.status = data.status;
  if (data.serviceName) update.serviceName = data.serviceName;
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.email !== undefined) update.email = data.email;
  if (data.phone !== undefined) update.phone = normalizePhone(data.phone);
  if (data.firstName !== undefined || data.lastName !== undefined) {
    const firstName = data.firstName ?? current.firstName;
    const lastName = data.lastName ?? current.lastName;
    update.firstName = firstName;
    update.lastName = lastName;
    update.customerName = `${firstName} ${lastName}`.trim();
  }

  if (data.date || data.start || data.end) {
    if (!data.date || !data.start || !data.end) {
      return NextResponse.json({ error: "Indica data, ora di inizio e ora di fine" }, { status: 400 });
    }
    const startAt = fromRomeLocal(data.date, data.start);
    const endAt = fromRomeLocal(data.date, data.end);
    if (!(endAt > startAt)) {
      return NextResponse.json({ error: "L'ora di fine deve essere dopo l'inizio" }, { status: 400 });
    }
    const status = data.status ?? current.status;
    if (!data.force && status !== "cancelled" && !(await isSlotFree(startAt, endAt, id))) {
      return NextResponse.json(
        { error: "L'orario si sovrappone a un altro appuntamento o blocco.", conflict: true },
        { status: 409 },
      );
    }
    update.startAt = startAt;
    update.endAt = endAt;
  }

  if (Object.keys(update).length > 0) {
    await db.update(bookings).set(update).where(eq(bookings.id, id));
  }
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));

  let notified = false;
  if (data.notify && booking.email) {
    const result = await sendBookingUpdateEmail(booking).catch((error) => {
      console.error("[email] avviso modifica fallito", error);
      return { sent: false };
    });
    notified = result.sent;
  }

  return NextResponse.json({ ok: true, booking, notified });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/bookings/[id]">,
) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  await getDb().delete(bookings).where(eq(bookings.id, id));
  return NextResponse.json({ ok: true });
}
