import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { ServiceList } from "@/components/service-list";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import {
  PAGE_SEO,
  breadcrumbJsonLd,
  jsonLdGraph,
  pageMetadata,
  servicesCatalogJsonLd,
  webPageJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  PAGE_SEO.servizi.path,
  PAGE_SEO.servizi.title,
  PAGE_SEO.servizi.description,
);
export const dynamic = "force-dynamic";

export default async function ServiziPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder));

  const jsonLd = jsonLdGraph([
    webPageJsonLd(PAGE_SEO.servizi.path, PAGE_SEO.servizi.title, PAGE_SEO.servizi.description),
    servicesCatalogJsonLd(rows),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Servizi", path: "/servizi" },
    ]),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd data={jsonLd} />
      <SectionHeading
        script="Listino"
        title="Prezzi"
        subtitle="Trattamenti in studio. Per prenotare, scegli il servizio e l’orario."
      />
      <div className="mt-12 space-y-10">
        <ServiceList
          category="servizi"
          services={rows.filter((row) => row.category === "servizi")}
        />
        <ServiceList
          category="refill"
          note="(entro 4 settimane)"
          services={rows.filter((row) => row.category === "refill")}
        />
        <ServiceList
          category="extra"
          services={rows.filter((row) => row.category === "extra")}
        />
        <div className="text-center">
          <Link
            href="/prenota"
            className="inline-flex rounded-full bg-gold px-6 py-3 text-base font-medium text-[#3a2c2e]"
          >
            Prenota un servizio
          </Link>
        </div>
      </div>
    </div>
  );
}
