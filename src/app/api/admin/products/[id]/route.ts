import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eurosToCents, parseColorList } from "@/lib/format";
import { deleteUpload } from "@/lib/uploads";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/products/[id]">,
) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const body = (await request.json()) as Partial<{
    name: string;
    description: string;
    priceEuros: string;
    shape: string;
    length: string;
    colors: string | string[];
    imageUrl: string;
    active: boolean;
  }>;

  const patch: Partial<typeof products.$inferInsert> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.description === "string") patch.description = body.description;
  if (body.priceEuros !== undefined) {
    const priceCents = eurosToCents(body.priceEuros);
    if (priceCents == null) {
      return NextResponse.json({ error: "Prezzo non valido" }, { status: 400 });
    }
    patch.priceCents = priceCents;
  }
  if (typeof body.shape === "string") patch.shape = body.shape;
  if (typeof body.length === "string") patch.length = body.length;
  if (body.colors !== undefined) patch.colors = JSON.stringify(parseColorList(body.colors));
  if (typeof body.imageUrl === "string") patch.imageUrl = body.imageUrl;
  if (typeof body.active === "boolean") patch.active = body.active;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
  }
  if (patch.name === "") {
    return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
  }

  const db = getDb();
  const [current] = await db.select().from(products).where(eq(products.id, id));
  if (!current) {
    return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
  }

  if (patch.imageUrl != null && current.imageUrl && current.imageUrl !== patch.imageUrl) {
    await deleteUpload(current.imageUrl);
  }

  await db.update(products).set(patch).where(eq(products.id, id));
  const [product] = await db.select().from(products).where(eq(products.id, id));
  return NextResponse.json({ product });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/products/[id]">,
) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const db = getDb();
  const [current] = await db.select().from(products).where(eq(products.id, id));
  await db.delete(products).where(eq(products.id, id));
  if (current?.imageUrl) await deleteUpload(current.imageUrl);
  return NextResponse.json({ ok: true });
}
