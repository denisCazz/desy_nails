import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#8f4e56",
          color: "#ead7a5",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        DT
      </div>
    ),
    { ...size },
  );
}
