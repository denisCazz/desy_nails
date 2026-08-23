import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { sendOrderEmails } from "@/lib/email";
import { slugId } from "@/lib/format";

const schema = z.object({
  customerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        unitPriceCents: z.number().int().nonnegative(),
        quantity: z.number().int().positive(),
        extraNote: z.string().optional(),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const id = slugId();
  const totalCents = parsed.data.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const db = getDb();

  await db.insert(orders).values({
    id,
    customerName: parsed.data.customerName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    notes: parsed.data.notes,
    status: "new",
    totalCents,
  });

  await db.insert(orderItems).values(
    parsed.data.items.map((item) => ({
      id: slugId(),
      orderId: id,
      productId: item.productId,
      serviceName: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      extraNote: item.extraNote ?? "",
    })),
  );

  await sendOrderEmails({
    id,
    customerName: parsed.data.customerName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    notes: parsed.data.notes,
    totalCents,
    items: parsed.data.items,
  });

  return NextResponse.json({ ok: true, id });
}
