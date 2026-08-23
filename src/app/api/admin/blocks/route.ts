import { NextResponse } from "next/server";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { blockedSlots } from "@/lib/db/schema";
import { slugId } from "@/lib/format";
import { fromRomeLocal } from "@/lib/time";

export async function POST(request: Request) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;

  const body = (await request.json()) as {
    title?: string;
    date?: string;
    start?: string;
    end?: string;
  };
  if (!body.date || !body.start || !body.end) {
    return NextResponse.json({ error: "Orario incompleto" }, { status: 400 });
  }

  const db = getDb();
  const inserted = await db
    .insert(blockedSlots)
    .values({
      id: slugId(),
      title: body.title || "Non disponibile",
      startAt: fromRomeLocal(body.date, body.start),
      endAt: fromRomeLocal(body.date, body.end),
      source: "admin",
      icalUid: `desy-block-${slugId()}@desynails`,
    })
    .returning();

  return NextResponse.json({ block: inserted[0] });
}
