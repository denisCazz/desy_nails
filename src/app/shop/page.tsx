import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { ShopClient } from "@/components/shop-client";
import { SectionHeading } from "@/components/section-heading";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.sortOrder));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <SectionHeading
        script="Unghie già fatte"
        title="Shop"
        subtitle="Set pronti da indossare, realizzati in studio. Scegli il modello, indica la misura nelle note e invia l’ordine via email."
      />
      <div className="mt-12">
        <ShopClient products={rows} />
      </div>
    </div>
  );
}
