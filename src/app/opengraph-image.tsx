import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Desy Nails — Desiree Tropini, nail artist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const hero = await readFile(join(process.cwd(), "public/images/hero.jpg"));
  const src = `data:image/jpeg;base64,${hero.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          background: "#3a2c2e",
        }}
      >
        <img
          src={src}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "78% center",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "linear-gradient(90deg, rgba(18,10,12,0.88) 0%, rgba(18,10,12,0.42) 48%, rgba(18,10,12,0.08) 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 80px",
            width: "62%",
            height: "100%",
            color: "#fff8f6",
          }}
        >
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 10, color: "#ead7a5" }}>
            DT
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 72,
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            Desy Nails
          </div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 32, color: "#ead7a5" }}>
            Desiree Tropini · Nail Artist
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              width: 112,
              height: 2,
              background: "#c4a35a",
            }}
          />
          <div style={{ display: "flex", marginTop: 24, fontSize: 26, color: "rgba(255,248,246,0.88)" }}>
            ogni dettaglio, la mia passione
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
