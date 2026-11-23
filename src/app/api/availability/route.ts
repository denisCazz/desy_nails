import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getAvailability } from "@/lib/availability";
import { BOOKING_WINDOW_DAYS } from "@/lib/booking-rules";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const serviceId = params.get("serviceId");
  if (!serviceId) {
    return NextResponse.json({ error: "Servizio mancante" }, { status: 400 });
  }
  const extraIds = (params.get("extras") ?? "").split(",").filter(Boolean).slice(0, 10);

  const db = getDb();
  const rows = await db.select().from(services).where(eq(services.id, serviceId));
  const service = rows[0];
  if (!service || !service.active || !service.bookable) {
    return NextResponse.json({ error: "Servizio non prenotabile" }, { status: 404 });
  }
  const extraRows = extraIds.length
    ? await db.select().from(services).where(inArray(services.id, extraIds))
    : [];
  const extraMinutes = extraRows
    .filter((row) => row.isAddon && row.active)
    .reduce((sum, row) => sum + row.durationMinutes, 0);

  const days = await getAvailability(service, BOOKING_WINDOW_DAYS, extraMinutes);
  return NextResponse.json({ days });
}
