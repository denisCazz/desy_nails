import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { ShopClient } from "@/components/shop-client";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";
import {
  PAGE_SEO,
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdGraph,
  pageMetadata,
  productsListJsonLd,
  webPageJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  PAGE_SEO.shop.path,
  PAGE_SEO.shop.title,
  PAGE_SEO.shop.description,
);
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.sortOrder));

  const jsonLd = jsonLdGraph([
    webPageJsonLd(PAGE_SEO.shop.path, PAGE_SEO.shop.title, PAGE_SEO.shop.description),
    {
      "@type": "CollectionPage",
      "@id": `${absoluteUrl(PAGE_SEO.shop.path)}#collection`,
      name: PAGE_SEO.shop.title,
      description: PAGE_SEO.shop.description,
    },
    productsListJsonLd(rows),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
    ]),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <JsonLd data={jsonLd} />
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
