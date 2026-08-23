import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export async function unauthorizedIfGuest() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return null;
}
