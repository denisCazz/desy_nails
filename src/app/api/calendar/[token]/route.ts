import { NextResponse } from "next/server";
import { addMinutes } from "@/lib/time";
import { buildStudioCalendar } from "@/lib/calendar";
import { getStudioConfig } from "@/lib/settings";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/calendar/[token]">,
) {
  const { token } = await context.params;
  const config = await getStudioConfig();
  if (!config.calendarToken || token !== config.calendarToken) {
    return NextResponse.json({ error: "Calendario non trovato" }, { status: 404 });
  }

  const from = addMinutes(new Date(), -60 * 24 * 30);
  const to = addMinutes(new Date(), 60 * 24 * 180);
  const ics = await buildStudioCalendar(from, to);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="desy-nails.ics"',
      "Cache-Control": "no-store",
    },
  });
}
