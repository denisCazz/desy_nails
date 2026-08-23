import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/db/schema";
import { GoldDivider } from "./gold-divider";

const titles: Record<string, string> = {
  servizi: "Servizi",
  refill: "Refil & Rimozione",
  extra: "Extra",
};

export function ServiceList({
  category,
  services,
  note,
}: {
  category: string;
  services: Service[];
  note?: string;
}) {
  return (
    <section className="gold-border rounded-[2rem] bg-surface p-6 md:p-10">
      <h2 className="text-center font-script text-5xl gold-text">{titles[category] ?? category}</h2>
      {note ? <p className="mt-2 text-center text-sm tracking-wide text-muted">{note}</p> : null}
      <GoldDivider className="mx-auto my-6 w-40" />
      <ul className="space-y-1">
        {services.map((service, index) => (
          <li key={service.id}>
            <div className="flex items-baseline gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium uppercase tracking-[0.14em] text-ink">
                  {service.name}
                </p>
                {service.description ? (
                  <p className="mt-1 text-sm text-muted">{service.description}</p>
                ) : null}
              </div>
              <span className="hidden flex-1 border-b border-dotted border-gold/50 sm:block" />
              <p className="shrink-0 font-serif text-xl text-gold">
                {formatPrice(service.priceCents, {
                  from: service.priceFrom,
                  note: service.priceNote || undefined,
                })}
              </p>
            </div>
            {index < services.length - 1 ? <GoldDivider /> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
