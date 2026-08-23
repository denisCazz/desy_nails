import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { eurosToCents } from "@/lib/format";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/services/[id]">,
) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const body = (await request.json()) as Partial<{
    active: boolean;
    name: string;
    description: string;
    category: string;
    priceEuros: string;
    priceCents: number | null;
    priceFrom: boolean;
    isAddon: boolean;
    priceNote: string;
    durationMinutes: number;
    bookable: boolean;
  }>;

  const patch: Partial<typeof services.$inferInsert> = {};
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.category === "string") patch.category = body.category;
  if (body.priceEuros !== undefined) patch.priceCents = eurosToCents(body.priceEuros);
  else if (body.priceCents !== undefined) patch.priceCents = body.priceCents;
  if (typeof body.priceFrom === "boolean") patch.priceFrom = body.priceFrom;
  if (typeof body.isAddon === "boolean") patch.isAddon = body.isAddon;
  if (typeof body.priceNote === "string") patch.priceNote = body.priceNote;
  if (body.durationMinutes != null) patch.durationMinutes = Number(body.durationMinutes) || 60;
  if (typeof body.bookable === "boolean") patch.bookable = body.bookable;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
  }
  if (patch.name === "") {
    return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
  }

  const db = getDb();
  await db.update(services).set(patch).where(eq(services.id, id));
  const [service] = await db.select().from(services).where(eq(services.id, id));
  return NextResponse.json({ ok: true, service });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/services/[id]">,
) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const db = getDb();
  await db.delete(services).where(eq(services.id, id));
  return NextResponse.json({ ok: true });
}
