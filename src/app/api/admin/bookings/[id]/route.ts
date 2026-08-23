import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/bookings/[id]">,
) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const { status } = (await request.json()) as { status?: string };
  if (!status) return NextResponse.json({ error: "Stato mancante" }, { status: 400 });
  const db = getDb();
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  return NextResponse.json({ ok: true });
}
