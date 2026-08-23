import { NextResponse } from "next/server";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { syncFromCalDav } from "@/lib/caldav";

export async function POST() {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;
  try {
    const result = await syncFromCalDav();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore CalDAV";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
