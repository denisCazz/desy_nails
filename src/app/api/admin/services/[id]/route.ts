import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";

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
    priceCents: number | null;
  }>;
  const db = getDb();
  await db.update(services).set(body).where(eq(services.id, id));
  return NextResponse.json({ ok: true });
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
