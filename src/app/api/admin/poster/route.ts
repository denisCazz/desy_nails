import { unauthorizedIfGuest } from "@/lib/admin-api";
import { buildPosterData, POSTER_STEP_OPTIONS, POSTER_WEEK_OPTIONS } from "@/lib/poster";
import { renderPosterPdf, renderPosterPng } from "@/lib/poster-image";
import { toRomeParts } from "@/lib/time";

export async function GET(request: Request) {
  const denied = await unauthorizedIfGuest();
  if (denied) return denied;

  const params = new URL(request.url).searchParams;
  const fromParam = params.get("dal") ?? "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(fromParam) ? fromParam : toRomeParts(new Date()).date;
  const weeksParam = Number(params.get("settimane"));
  const weeks = POSTER_WEEK_OPTIONS.includes(weeksParam) ? weeksParam : 2;
  const stepParam = Number(params.get("passo"));
  const stepMinutes = POSTER_STEP_OPTIONS.includes(stepParam) ? stepParam : 60;
  const format = params.get("formato") === "pdf" ? "pdf" : "png";
  const download = params.get("scarica") === "1";

  const data = await buildPosterData({ from, weeks, stepMinutes });
  const siteHost = new URL(process.env.APP_URL || "https://desynails.it").hostname.replace(/^www\./, "");
  const png = await renderPosterPng(data, siteHost);
  const filename = `disponibilita-${from}.${format}`;
  const disposition = `${download ? "attachment" : "inline"}; filename="${filename}"`;

  if (format === "png") {
    return new Response(png.body, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
      },
    });
  }

  const pdf = await renderPosterPdf(await png.arrayBuffer());
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
