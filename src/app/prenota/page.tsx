import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { BookingForm } from "@/components/booking-form";
import { SectionHeading } from "@/components/section-heading";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Prenota" };
export const dynamic = "force-dynamic";

export default async function PrenotaPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <SectionHeading
        script="Il tuo momento"
        title="Prenota"
        subtitle="Che sia per una manicure, una ricostruzione o un refill, sono qui per prendermi cura di te e valorizzare la tua bellezza."
      />
      <div className="mt-12">
        <BookingForm
          services={rows.filter((row) => !row.isAddon)}
          extras={rows.filter((row) => row.isAddon)}
        />
      </div>
    </div>
  );
}
