import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isSlotFree } from "@/lib/availability";
import { pushBookingToCalDav } from "@/lib/caldav";
import { getDb } from "@/lib/db";
import { bookings, services, type BookingExtra } from "@/lib/db/schema";
import { sendBookingEmails } from "@/lib/email";
import { slugId } from "@/lib/format";
import { addMinutes, fromRomeLocal } from "@/lib/time";

const schema = z.object({
  serviceId: z.string(),
  extraIds: z.array(z.string()).default([]),
  date: z.string(),
  time: z.string(),
  customerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const db = getDb();
  const serviceRows = await db
    .select()
    .from(services)
    .where(eq(services.id, parsed.data.serviceId));
  const service = serviceRows[0];
  if (!service?.bookable || !service.active) {
    return NextResponse.json({ error: "Servizio non disponibile" }, { status: 400 });
  }

  const extraRows = parsed.data.extraIds.length
    ? await Promise.all(
        parsed.data.extraIds.map((id) =>
          db.select().from(services).where(eq(services.id, id)),
        ),
      )
    : [];
  const extras: BookingExtra[] = extraRows
    .map((rows) => rows[0])
    .filter((row) => row?.isAddon)
    .map((row) => ({
      id: row.id,
      name: row.name,
      priceCents: row.priceCents ?? 0,
      quantity: 1,
    }));

  const extraMinutes = extras.reduce((sum, extra) => {
    const match = extraRows.flat().find((row) => row?.id === extra.id);
    return sum + (match?.durationMinutes ?? 0);
  }, 0);

  const startAt = fromRomeLocal(parsed.data.date, parsed.data.time);
  const endAt = addMinutes(startAt, service.durationMinutes + extraMinutes);
  if (!(await isSlotFree(startAt, endAt))) {
    return NextResponse.json({ error: "Slot non più disponibile" }, { status: 409 });
  }

  const id = slugId();
  await db.insert(bookings).values({
    id,
    customerName: parsed.data.customerName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    serviceId: service.id,
    serviceName: service.name,
    startAt,
    endAt,
    notes: parsed.data.notes,
    extras,
    status: "pending",
    source: "site",
    icalUid: `desy-booking-${id}@desynails`,
  });

  await sendBookingEmails({
    id,
    customerName: parsed.data.customerName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    serviceName: service.name,
    startAt,
    endAt,
    notes: parsed.data.notes,
    extras,
  });

  pushBookingToCalDav(id).catch((error) => console.error(error));

  return NextResponse.json({ ok: true, id });
}
