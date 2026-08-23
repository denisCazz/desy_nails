import type { Metadata } from "next";
import { CalendarHeart } from "lucide-react";
import { GoldDivider } from "@/components/gold-divider";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = { title: "Regolamento" };

const rules = [
  "I prezzi del refill sono validi entro 4 settimane dall’ultimo appuntamento.",
  "Oltre le 4 settimane il prezzo verrà valutato in base alla ricrescita e al lavoro necessario.",
  "In caso di numerose rotture, sollevamenti importanti o richiesta di cambio forma/lunghezza, il servizio potrebbe essere considerato una nuova applicazione o prevedere un supplemento.",
  "Cambio forma o allungamento durante il refill: +5/10 €.",
  "La rimozione del mio lavoro è sempre inclusa se viene effettuato un nuovo servizio.",
  "La rimozione di un lavoro eseguito da un’altra onicotecnica prevede un supplemento di 5 € se seguita da un nuovo servizio.",
];

export default function RegolamentoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <SectionHeading script="Studio" title="Regolamento" />
      <GoldDivider className="mx-auto my-8 w-40" />
      <ol className="space-y-5">
        {rules.map((rule, index) => (
          <li key={rule} className="gold-border flex gap-4 rounded-2xl bg-surface p-5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gold text-gold">
              {index === 0 ? <CalendarHeart className="size-4" /> : index + 1}
            </span>
            <p className="text-muted leading-relaxed">{rule}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
