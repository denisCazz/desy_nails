import Link from "next/link";
import { mondayOf, POSTER_STEP_OPTIONS, POSTER_WEEK_OPTIONS } from "@/lib/poster";
import { addMinutes, fromRomeLocal, toRomeParts } from "@/lib/time";

export const dynamic = "force-dynamic";

const STEP_LABELS: Record<number, string> = {
  30: "30 minuti",
  60: "1 ora",
  90: "1 ora e mezza",
  120: "2 ore",
};

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPosterPage({
  searchParams,
}: PageProps<"/admin/disponibilita/locandina">) {
  const params = await searchParams;
  const today = toRomeParts(new Date()).date;
  const fromParam = pick(params.dal) ?? "";
  const from = mondayOf(/^\d{4}-\d{2}-\d{2}$/.test(fromParam) ? fromParam : today);
  const weeksParam = Number(pick(params.settimane));
  const weeks = POSTER_WEEK_OPTIONS.includes(weeksParam) ? weeksParam : 2;
  const stepParam = Number(pick(params.passo));
  const step = POSTER_STEP_OPTIONS.includes(stepParam) ? stepParam : 60;

  const query = new URLSearchParams({ dal: from, settimane: String(weeks), passo: String(step) });
  const src = (format: "png" | "pdf", download = false) =>
    `/api/admin/poster?${query}&formato=${format}${download ? "&scarica=1" : ""}`;
  const nextMonday = toRomeParts(addMinutes(fromRomeLocal(mondayOf(today), "12:00"), 7 * 24 * 60)).date;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl text-mauve">Locandina disponibilità</h2>
          <p className="text-sm text-muted">
            Immagine da condividere sui social: gli orari barrati sono già prenotati o bloccati.
          </p>
        </div>
        <Link href="/admin/disponibilita" className="text-sm text-gold underline-offset-4 hover:underline">
          ← Disponibilità
        </Link>
      </div>

      <form className="gold-border mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-surface p-4 text-sm">
        <label>
          Settimana del
          <input type="date" name="dal" defaultValue={from} className="block rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <label>
          Periodo
          <select name="settimane" defaultValue={String(weeks)} className="block rounded-xl border border-line bg-paper px-3 py-2">
            {POSTER_WEEK_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 1 ? "1 settimana" : `${option} settimane`}
              </option>
            ))}
          </select>
        </label>
        <label>
          Orari ogni
          <select name="passo" defaultValue={String(step)} className="block rounded-xl border border-line bg-paper px-3 py-2">
            {POSTER_STEP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {STEP_LABELS[option] ?? `${option} minuti`}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-full border border-gold px-4 py-2">Aggiorna</button>
        <Link
          href={`/admin/disponibilita/locandina?dal=${nextMonday}&settimane=${weeks}&passo=${step}`}
          className="rounded-full px-4 py-2 text-muted hover:text-mauve"
        >
          Dalla prossima settimana
        </Link>
      </form>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element -- immagine generata dinamicamente, non ottimizzabile */}
        <img
          src={src("png")}
          alt="Anteprima locandina disponibilità"
          width={540}
          height={960}
          className="gold-border w-full max-w-[420px] rounded-2xl"
        />
        <div className="flex flex-col gap-3">
          <a href={src("png", true)} className="rounded-full bg-gold px-6 py-3 text-center text-[#3a2c2e]">
            Scarica immagine (PNG)
          </a>
          <a href={src("pdf", true)} className="rounded-full border border-gold px-6 py-3 text-center">
            Scarica PDF
          </a>
          <p className="max-w-xs text-xs text-muted">
            Per le storie Instagram usa il PNG (formato 1080×1920). L&apos;immagine si aggiorna con le
            prenotazioni del momento: rigenerala prima di pubblicarla.
          </p>
        </div>
      </div>
    </div>
  );
}
