import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/orders/[id]">,
) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const { status } = (await request.json()) as { status?: string };
  if (!status) return NextResponse.json({ error: "Stato mancante" }, { status: 400 });
  const db = getDb();
  await db.update(orders).set({ status }).where(eq(orders.id, id));
  return NextResponse.json({ ok: true });
}
