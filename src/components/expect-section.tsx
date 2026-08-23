import { CalendarHeart, Clock3, Heart, Sparkles, Leaf } from "lucide-react";
import { SectionHeading } from "./section-heading";

const items = [
  {
    icon: CalendarHeart,
    title: "Su appuntamento",
    text: "Per garantirti il giusto tempo, la massima attenzione e un servizio personalizzato.",
  },
  {
    icon: Clock3,
    title: "Puntualità",
    text: "Il tuo tempo è prezioso: rispetto sempre gli orari e la tua puntualità.",
  },
  {
    icon: Sparkles,
    title: "Igiene e sicurezza",
    text: "Ambiente pulito e strumenti sterilizzati per garantirti sicurezza e tranquillità.",
  },
  {
    icon: Heart,
    title: "Accoglienza",
    text: "Un ambiente curato e rilassante, dove sentirti a tuo agio e coccolata.",
  },
  {
    icon: Leaf,
    title: "Qualità",
    text: "Utilizzo solo prodotti selezionati e tecniche professionali per risultati duraturi e naturali.",
  },
];

export function ExpectSection() {
  return (
    <section className="bg-blush/35 px-4 py-20 dark:bg-blush/20">
      <SectionHeading
        title="Cosa puoi aspettarti"
        subtitle="Ogni appuntamento è pensato per offrirti un’esperienza piacevole, rilassante e su misura per te."
      />
      <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-3xl bg-surface/80 p-6 gold-border">
            <div className="inline-flex size-11 items-center justify-center rounded-full border border-gold/60 text-gold">
              <item.icon className="size-5" />
            </div>
            <h3 className="mt-4 font-serif text-xl uppercase tracking-wide text-mauve">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
