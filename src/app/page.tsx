import Link from "next/link";
import { ExpectSection } from "@/components/expect-section";
import { GoldDivider } from "@/components/gold-divider";
import { Hero } from "@/components/hero";
import { UniqueSection } from "@/components/unique-section";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="px-4 py-16 text-center">
        <p className="text-xs tracking-[0.42em] uppercase text-gold">Desiree Tropini Studio</p>
        <h2 className="mt-3 font-serif text-4xl text-mauve">Nail Artist</h2>
        <GoldDivider className="mx-auto my-6 w-40" />
        <p className="mx-auto max-w-2xl text-lg text-muted leading-relaxed">
          Ciao, sono Desiree Tropini. La precisione e la cura dei dettagli sono ciò che porto in
          ogni trattamento. Credo che ogni trattamento debba valorizzare la persona, rispettando
          il suo stile, le sue esigenze e la sua unicità.
        </p>
        <Link
          href="/chi-sono"
          className="mt-6 inline-block border-b border-gold pb-0.5 text-base text-mauve"
        >
          Scopri chi sono →
        </Link>
      </section>
      <UniqueSection />
      <ExpectSection />
      <section className="px-4 py-20 text-center">
        <p className="font-script text-4xl text-gold">Prenota il tuo momento</p>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Che sia per una manicure, una ricostruzione o un refill, sono qui per prendermi cura di
          te e valorizzare la tua bellezza.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/prenota"
            className="rounded-full bg-gold px-6 py-3 text-base font-medium text-[#3a2c2e]"
          >
            Prenota un servizio
          </Link>
          <Link
            href="/shop"
            className="rounded-full border border-gold px-6 py-3 text-base text-mauve"
          >
            Shop unghie già fatte
          </Link>
        </div>
        <p className="mt-8 font-script text-2xl text-gold">non vedo l’ora di prendermi cura di te</p>
      </section>
    </>
  );
}
