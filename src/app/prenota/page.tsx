import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { BookingForm } from "@/components/booking-form";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import {
  PAGE_SEO,
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdGraph,
  pageMetadata,
  webPageJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  PAGE_SEO.prenota.path,
  PAGE_SEO.prenota.title,
  PAGE_SEO.prenota.description,
);
export const dynamic = "force-dynamic";

export default async function PrenotaPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder));

  const jsonLd = jsonLdGraph([
    webPageJsonLd(PAGE_SEO.prenota.path, PAGE_SEO.prenota.title, PAGE_SEO.prenota.description),
    {
      "@type": "ReserveAction",
      name: "Prenota un servizio",
      target: absoluteUrl("/prenota"),
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Prenota", path: "/prenota" },
    ]),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <JsonLd data={jsonLd} />
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
