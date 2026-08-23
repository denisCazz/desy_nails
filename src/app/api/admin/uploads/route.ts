import { NextResponse } from "next/server";
import { unauthorizedIfGuest } from "@/lib/admin-api";
import { saveUpload } from "@/lib/uploads";

export async function POST(request: Request) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Nessuna immagine" }, { status: 400 });
  }

  try {
    const url = await saveUpload(file);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload non riuscito.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
