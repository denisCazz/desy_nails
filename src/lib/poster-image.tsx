import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PDFDocument } from "pdf-lib";
import type { PosterData, PosterDay } from "./poster";

export const POSTER_SIZE = { width: 1080, height: 1920 };

const COLORS = {
  ink: "#5a1f2e",
  slot: "#33296b",
  line: "rgba(90, 31, 46, 0.35)",
  muted: "rgba(90, 31, 46, 0.7)",
};

const fontFile = (name: string) => readFile(join(process.cwd(), "public/fonts", name));
const fontsPromise = Promise.all([
  fontFile("PlayfairDisplay-SemiBold.ttf"),
  fontFile("PlayfairDisplay-Medium.ttf"),
  fontFile("GreatVibes-Regular.ttf"),
  fontFile("Outfit-Regular.ttf"),
  fontFile("Outfit-Medium.ttf"),
]);

async function loadFonts() {
  const [playfairSemi, playfairMedium, greatVibes, outfit, outfitMedium] = await fontsPromise;
  return [
    { name: "Playfair", data: playfairSemi, weight: 600 as const, style: "normal" as const },
    { name: "Playfair", data: playfairMedium, weight: 500 as const, style: "normal" as const },
    { name: "Script", data: greatVibes, weight: 400 as const, style: "normal" as const },
    { name: "Outfit", data: outfit, weight: 400 as const, style: "normal" as const },
    { name: "Outfit", data: outfitMedium, weight: 500 as const, style: "normal" as const },
  ];
}

function Heart({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
        stroke={COLORS.ink}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Divider({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 24 }}>
      <div style={{ display: "flex", flex: 1, height: 2, background: COLORS.line }} />
      {children}
      <div style={{ display: "flex", flex: 1, height: 2, background: COLORS.line }} />
    </div>
  );
}

function Struck({
  children,
  struck,
  fontSize,
}: {
  children: string;
  struck: boolean;
  fontSize: number;
}) {
  return (
    <div style={{ display: "flex", position: "relative", whiteSpace: "pre" }}>
      {children}
      {struck ? (
        <div
          style={{
            position: "absolute",
            left: -2,
            right: -2,
            top: Math.round(fontSize * 0.56),
            height: Math.max(2, Math.round(fontSize / 11)),
            background: COLORS.slot,
          }}
        />
      ) : null}
    </div>
  );
}

function DayRow({ day, height, slotFont }: { day: PosterDay; height: number; slotFont: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height,
        borderBottom: `1.5px solid ${COLORS.line}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", width: 272, flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            width: 104,
            fontFamily: "Playfair",
            fontWeight: 500,
            fontSize: Math.min(76, height * 0.72),
            color: COLORS.ink,
          }}
        >
          {day.dayNumber}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Playfair",
            fontWeight: 500,
            fontSize: 23,
            letterSpacing: 1,
            color: COLORS.slot,
            textTransform: "uppercase",
          }}
        >
          {day.weekday}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignSelf: "stretch",
          width: 2,
          background: COLORS.line,
          marginRight: 22,
        }}
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          flex: 1,
          alignItems: "center",
          fontFamily: "Outfit",
          fontSize: slotFont,
          color: COLORS.slot,
          rowGap: 6,
        }}
      >
        {day.closed ? (
          <div style={{ display: "flex", fontFamily: "Playfair", fontSize: slotFont + 4, color: COLORS.muted }}>
            Chiuso
          </div>
        ) : (
          day.slots.map((slot, index) => {
            const next = day.slots[index + 1];
            return (
              <div key={slot.time} style={{ display: "flex" }}>
                <Struck struck={slot.taken} fontSize={slotFont}>
                  {slot.time}
                </Struck>
                {next ? (
                  <Struck struck={slot.taken && next.taken} fontSize={slotFont}>
                    {" / "}
                  </Struck>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export async function renderPosterPng(data: PosterData, siteHost: string) {
  const totalDays = data.weeks.reduce((sum, week) => sum + week.days.length, 0);
  const maxSlots = Math.max(1, ...data.weeks.flatMap((week) => week.days.map((day) => day.slots.length)));
  const available = POSTER_SIZE.height - 470 - 190 - data.weeks.length * 110;
  const rowHeight = Math.max(64, Math.min(112, Math.floor(available / Math.max(1, totalDays))));
  const slotFont = Math.floor(Math.max(21, Math.min(32, 650 / (maxSlots * 3.15))));

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
          padding: "80px 64px 60px",
          background: "linear-gradient(180deg, #f9e4e3 0%, #f4d3d5 55%, #f1cbcf 100%)",
          color: COLORS.ink,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Playfair",
            fontWeight: 600,
            fontSize: 112,
            letterSpacing: 4,
            lineHeight: 1,
          }}
        >
          DISPONIBILITÀ
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Script",
            fontSize: 132,
            lineHeight: 1.1,
            marginTop: 4,
          }}
        >
          {data.subtitle}
        </div>
        <div style={{ display: "flex", width: "100%", marginTop: 20, marginBottom: 10 }}>
          <Divider>
            <Heart />
          </Divider>
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: "100%", flex: 1 }}>
          {data.weeks.map((week, index) => (
            <div key={week.label + index} style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
              <Divider>
                <div
                  style={{
                    display: "flex",
                    fontFamily: "Playfair",
                    fontWeight: 600,
                    fontSize: 44,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {week.label}
                </div>
              </Divider>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
                {week.days.map((day) => (
                  <DayRow key={day.dateStr} day={day} height={rowHeight} slotFont={slotFont} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 16 }}>
          <Divider>
            <Heart size={34} />
          </Divider>
          <div style={{ display: "flex", fontFamily: "Outfit", fontWeight: 500, fontSize: 30, letterSpacing: 1 }}>
            Prenota su {siteHost}
            {data.instagram ? `  ·  @${data.instagram.replace(/^@/, "")}` : ""}
          </div>
          <div style={{ display: "flex", fontFamily: "Outfit", fontSize: 22, color: COLORS.muted }}>
            Gli orari barrati sono già prenotati
          </div>
        </div>
      </div>
    ),
    {
      ...POSTER_SIZE,
      fonts: await loadFonts(),
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function renderPosterPdf(png: ArrayBuffer) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Disponibilità Desy Nails");
  const image = await pdf.embedPng(png);
  const width = POSTER_SIZE.width / 2;
  const height = POSTER_SIZE.height / 2;
  const page = pdf.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });
  return pdf.save();
}
