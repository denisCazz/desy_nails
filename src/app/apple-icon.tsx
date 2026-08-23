import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#8f4e56",
          color: "#ead7a5",
        }}
      >
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>DT</div>
        <div style={{ display: "flex", marginTop: 8, fontSize: 16, letterSpacing: 4, color: "#fbf3f0" }}>
          DESY
        </div>
      </div>
    ),
    { ...size },
  );
}
