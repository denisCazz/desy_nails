import type { Metadata } from "next";
import { ExpectSection } from "@/components/expect-section";
import { GoldDivider } from "@/components/gold-divider";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { UniqueSection } from "@/components/unique-section";
import { INSTAGRAM_HANDLE } from "@/lib/brand";
import {
  PAGE_SEO,
  breadcrumbJsonLd,
  jsonLdGraph,
  pageMetadata,
  personJsonLd,
  webPageJsonLd,
} from "@/lib/seo";
import { getSetting } from "@/lib/settings";

export const metadata: Metadata = pageMetadata(
  PAGE_SEO.chiSono.path,
  PAGE_SEO.chiSono.title,
  PAGE_SEO.chiSono.description,
);

export default async function ChiSonoPage() {
  const instagram = (await getSetting("instagram", INSTAGRAM_HANDLE)) || INSTAGRAM_HANDLE;
  const jsonLd = jsonLdGraph([
    webPageJsonLd(PAGE_SEO.chiSono.path, PAGE_SEO.chiSono.title, PAGE_SEO.chiSono.description),
    personJsonLd(instagram),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Chi sono", path: "/chi-sono" },
    ]),
  ]);

  return (
    <div className="relative overflow-hidden">
      <JsonLd data={jsonLd} />
      <span className="watermark absolute -right-8 top-24 text-[12rem] text-blush/70 dark:text-blush/30">
        DT
      </span>
      <section className="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading script="Ciao" title="Chi sono" />
        <GoldDivider className="mx-auto my-8 w-40" />
        <div className="space-y-6 text-lg leading-relaxed text-muted">
          <p>
            Ciao, sono <strong className="text-mauve">Desiree Tropini</strong>.
          </p>
          <p>
            La precisione e la cura dei dettagli sono ciò che porto in ogni trattamento. Credo che
            ogni trattamento debba valorizzare la persona, rispettando il suo stile, le sue
            esigenze e la sua unicità.
          </p>
          <p>
            La mia missione è farti sentire ascoltata, valorizzata e sicura di scegliere il meglio
            per te.
          </p>
        </div>
      </section>

      <section className="bg-blush/30 px-4 py-16 dark:bg-blush/15">
        <div className="mx-auto max-w-3xl">
          <SectionHeading title="Formazione" />
          <GoldDivider className="mx-auto my-6 w-32" />
          <div className="space-y-4 text-base text-muted">
            <p>
              Ho frequentato la scuola professionale di estetista, costruendo le basi del mio
              percorso.
            </p>
            <p>
              La formazione è una parte importante del mio lavoro e continua ad accompagnare la
              mia crescita professionale.
            </p>
            <article className="gold-border mt-8 rounded-3xl bg-surface p-6">
              <p className="text-sm tracking-[0.28em] uppercase text-gold">Attestato</p>
              <h3 className="mt-2 font-serif text-2xl text-mauve">Corso Professionale di Nail Art</h3>
              <p className="mt-2 text-sm">DUAL FORM Base Online · 4 settembre 2023</p>
              <p className="text-sm text-muted">100 Colpi di Lima · Manuela Sasso</p>
            </article>
          </div>
        </div>
      </section>
      <UniqueSection />
      <ExpectSection />
    </div>
  );
}
