import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/products/[id]">,
) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const db = getDb();
  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ ok: true });
}
