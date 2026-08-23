import { Award, Heart, Sparkles, UserRound } from "lucide-react";
import { SectionHeading } from "./section-heading";

const items = [
  {
    icon: Heart,
    title: "Passione",
    text: "Amo ciò che faccio e si vede in ogni dettaglio.",
  },
  {
    icon: Sparkles,
    title: "Precisione",
    text: "Ogni lavoro è eseguito con cura, pulizia e attenzione.",
  },
  {
    icon: UserRound,
    title: "Ascolto",
    text: "Ogni cliente è unica: ti ascolto e creo il trattamento su di te.",
  },
  {
    icon: Award,
    title: "Aggiornamento",
    text: "Studio, mi aggiorno costantemente e scelgo solo prodotti di qualità.",
  },
];

export function UniqueSection() {
  return (
    <section className="px-4 py-20">
      <SectionHeading title="Cosa mi rende unica" />
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.title}
            className="gold-border rounded-3xl bg-surface p-6 shadow-[0_10px_40px_-24px_rgba(143,78,86,0.45)]"
          >
            <item.icon className="size-6 text-gold" />
            <h3 className="mt-4 font-serif text-2xl text-mauve">{item.title}</h3>
            <p className="mt-2 text-base text-muted">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
