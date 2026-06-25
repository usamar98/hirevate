import { ImageResponse } from "next/og";
import { defaultDescription, siteName } from "@/lib/seo";

export const alt = "Hirevate hidden jobs and resume tools";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f8fafc",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, Helvetica, sans-serif",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "22px",
            marginBottom: "38px"
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "#111827",
              borderRadius: "18px",
              color: "white",
              display: "flex",
              fontSize: "48px",
              fontWeight: 700,
              height: "86px",
              justifyContent: "center",
              width: "86px"
            }}
          >
            H
          </div>
          <div style={{ fontSize: "74px", fontWeight: 800, letterSpacing: 0 }}>{siteName}</div>
        </div>
        <div
          style={{
            color: "#334155",
            fontSize: "38px",
            lineHeight: 1.25,
            maxWidth: "900px",
            textAlign: "center"
          }}
        >
          {defaultDescription}
        </div>
      </div>
    ),
    size
  );
}
