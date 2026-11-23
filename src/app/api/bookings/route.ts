import { NextResponse } from "next/server";
import { and, count, eq, gt, gte, inArray, or } from "drizzle-orm";
import { z } from "zod";
import {
  containsLinks,
  getClientIp,
  hashIp,
  isDisposableEmail,
  rateLimit,
  verifyFormToken,
  verifyTurnstile,
} from "@/lib/anti-spam";
import { getBusyRanges, isSlotFree, slotsForDay } from "@/lib/availability";
import { pushBookingToCalDav } from "@/lib/caldav";
import { getDb } from "@/lib/db";
import { bookings, services, type BookingExtra } from "@/lib/db/schema";
import { sendBookingEmails } from "@/lib/email";
import { slugId } from "@/lib/format";
import { getStudioConfig } from "@/lib/settings";
import { addMinutes, fromRomeLocal } from "@/lib/time";
import { normalizePhone, personNameSchema, phoneSchema } from "@/lib/validation";

const MAX_BOOKINGS_PER_IP_PER_DAY = 4;
const MAX_ACTIVE_BOOKINGS_PER_CUSTOMER = 3;
const BOOKING_WINDOW_DAYS = 60;

const schema = z.object({
  serviceId: z.string().max(64),
  extraIds: z.array(z.string().max(64)).max(10).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  firstName: personNameSchema,
  lastName: personNameSchema,
  email: z.string().trim().toLowerCase().max(255).pipe(z.email()),
  phone: phoneSchema,
  notes: z.string().trim().max(1000).optional().default(""),
  website: z.string().optional().default(""),
  formToken: z.string().max(200),
  captchaToken: z.string().max(4000).optional().default(""),
});

function tooMany(message: string) {
  return NextResponse.json({ error: message }, { status: 429 });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`booking:${ip}`, 5, 10 * 60 * 1000)) {
    return tooMany("Troppi tentativi. Riprova tra qualche minuto.");
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Controlla i dati inseriti: nome, cognome, email e telefono sono obbligatori." },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Honeypot compilato: risposta finta di successo, così il bot non impara nulla.
  if (data.website.trim() !== "") {
    console.warn("[anti-spam] honeypot compilato", { ip });
    return NextResponse.json({ ok: true, id: slugId() });
  }

  const token = verifyFormToken(data.formToken);
  if (!token.ok) {
    console.warn("[anti-spam] form token rifiutato", { ip, reason: token.reason });
    const message =
      token.reason === "expired"
        ? "La pagina è rimasta aperta troppo a lungo. Ricaricala e riprova."
        : "Verifica non riuscita. Ricarica la pagina e riprova.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const captcha = await verifyTurnstile(data.captchaToken, ip, "booking");
  if (!captcha.ok) {
    return NextResponse.json(
      { error: "Verifica anti-bot non superata. Ricarica la pagina e riprova." },
      { status: 400 },
    );
  }

  if (containsLinks(data.firstName, data.lastName, data.notes)) {
    return NextResponse.json(
      { error: "Link e codice HTML non sono ammessi nel modulo." },
      { status: 400 },
    );
  }
  if (isDisposableEmail(data.email)) {
    return NextResponse.json(
      { error: "Usa un indirizzo email personale, non temporaneo." },
      { status: 400 },
    );
  }

  const db = getDb();
  const ipHash = hashIp(ip);
  const phone = normalizePhone(data.phone);
  const now = new Date();

  const [[ipCount], [customerCount]] = await Promise.all([
    db
      .select({ value: count() })
      .from(bookings)
      .where(and(eq(bookings.ipHash, ipHash), gte(bookings.createdAt, addMinutes(now, -24 * 60)))),
    db
      .select({ value: count() })
      .from(bookings)
      .where(
        and(
          or(eq(bookings.email, data.email), eq(bookings.phone, phone)),
          inArray(bookings.status, ["pending", "confirmed"]),
          gt(bookings.startAt, now),
        ),
      ),
  ]);
  if (ipCount.value >= MAX_BOOKINGS_PER_IP_PER_DAY) {
    return tooMany("Hai già inviato diverse richieste oggi. Scrivimi su Instagram per altre prenotazioni.");
  }
  if (customerCount.value >= MAX_ACTIVE_BOOKINGS_PER_CUSTOMER) {
    return tooMany("Hai già diversi appuntamenti in programma. Contattami per prenotarne altri.");
  }

  const [service] = await db.select().from(services).where(eq(services.id, data.serviceId));
  if (!service?.bookable || !service.active) {
    return NextResponse.json({ error: "Servizio non disponibile" }, { status: 400 });
  }

  const extraRows = data.extraIds.length
    ? await db.select().from(services).where(inArray(services.id, data.extraIds))
    : [];
  const validExtras = extraRows.filter((row) => row.isAddon && row.active);
  const extras: BookingExtra[] = validExtras.map((row) => ({
    id: row.id,
    name: row.name,
    priceCents: row.priceCents ?? 0,
    quantity: 1,
  }));
  const extraMinutes = validExtras.reduce((sum, row) => sum + row.durationMinutes, 0);

  const startAt = fromRomeLocal(data.date, data.time);
  if (Number.isNaN(startAt.getTime()) || startAt > addMinutes(now, BOOKING_WINDOW_DAYS * 24 * 60)) {
    return NextResponse.json({ error: "Data non valida" }, { status: 400 });
  }
  const endAt = addMinutes(startAt, service.durationMinutes + extraMinutes);

  const config = await getStudioConfig();
  const dayStart = fromRomeLocal(data.date, "00:00");
  const daySlots = slotsForDay({
    dateStr: data.date,
    durationMinutes: service.durationMinutes,
    interval: config.slotInterval,
    bufferMinutes: config.bufferMinutes,
    workingHours: config.workingHours,
    busy: await getBusyRanges(dayStart, addMinutes(dayStart, 24 * 60)),
    now,
  });
  if (!daySlots.includes(data.time)) {
    return NextResponse.json(
      { error: "Orario non più disponibile. Scegline un altro." },
      { status: 409 },
    );
  }
  if (!(await isSlotFree(startAt, endAt))) {
    return NextResponse.json(
      { error: "Con gli extra scelti l'orario non è più libero. Prova un altro orario." },
      { status: 409 },
    );
  }

  const id = slugId();
  const customerName = `${data.firstName} ${data.lastName}`;
  await db.insert(bookings).values({
    id,
    customerName,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone,
    serviceId: service.id,
    serviceName: service.name,
    startAt,
    endAt,
    notes: data.notes,
    extras,
    status: "pending",
    source: "site",
    ipHash,
    icalUid: `desy-booking-${id}@desynails`,
  });

  await sendBookingEmails({
    id,
    customerName,
    email: data.email,
    phone,
    serviceName: service.name,
    startAt,
    endAt,
    notes: data.notes,
    extras,
  }).catch((error) => console.error("[email] invio prenotazione fallito", error));

  pushBookingToCalDav(id).catch((error) => console.error(error));

  return NextResponse.json({ ok: true, id });
}
