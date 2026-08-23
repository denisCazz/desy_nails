import { NextResponse } from "next/server";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { slugId } from "@/lib/format";

export async function POST(request: Request) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    priceEuros?: string;
    shape?: string;
    length?: string;
    colors?: string;
  };

  if (!body.name || body.priceEuros == null || body.priceEuros === "") {
    return NextResponse.json({ error: "Nome e prezzo obbligatori" }, { status: 400 });
  }

  const colors = (body.colors ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const db = getDb();
  const inserted = await db
    .insert(products)
    .values({
      id: slugId(),
      name: body.name,
      description: body.description ?? "",
      priceCents: Math.round(Number(body.priceEuros) * 100),
      shape: body.shape ?? "almond",
      length: body.length ?? "M",
      colors: JSON.stringify(colors),
      active: true,
      sortOrder: Date.now(),
    })
    .returning();

  return NextResponse.json({ product: inserted[0] });
}
