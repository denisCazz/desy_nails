import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAvailability } from "@/lib/availability";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";

export async function GET(request: Request) {
  const serviceId = new URL(request.url).searchParams.get("serviceId");
  if (!serviceId) {
    return NextResponse.json({ error: "Servizio mancante" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.select().from(services).where(eq(services.id, serviceId));
  const service = rows[0];
  if (!service || !service.active || !service.bookable) {
    return NextResponse.json({ error: "Servizio non prenotabile" }, { status: 404 });
  }

  const days = await getAvailability(service);
  return NextResponse.json({ days });
}
