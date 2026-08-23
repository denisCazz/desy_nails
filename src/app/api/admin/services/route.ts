import { NextResponse } from "next/server";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { slugId } from "@/lib/format";

export async function POST(request: Request) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;

  const body = (await request.json()) as {
    name?: string;
    category?: string;
    priceEuros?: string;
    durationMinutes?: number;
    bookable?: boolean;
    isAddon?: boolean;
    priceFrom?: boolean;
    priceNote?: string;
    description?: string;
  };

  if (!body.name) {
    return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
  }

  const priceCents =
    body.priceEuros === "" || body.priceEuros == null
      ? null
      : Math.round(Number(body.priceEuros) * 100);

  const id = slugId();
  const db = getDb();
  const inserted = await db
    .insert(services)
    .values({
      id,
      name: body.name,
      description: body.description ?? "",
      category: body.category ?? "servizi",
      priceCents,
      priceFrom: Boolean(body.priceFrom),
      isAddon: Boolean(body.isAddon),
      priceNote: body.priceNote ?? "",
      durationMinutes: body.durationMinutes || 60,
      bookable: body.bookable ?? true,
      active: true,
      sortOrder: Date.now(),
    })
    .returning();

  return NextResponse.json({ service: inserted[0] });
}
