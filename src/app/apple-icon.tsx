import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(135deg, #16a34a33, #15803d22)",
          border: "3px solid #22c55e44",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontSize: 110,
          backgroundColor: "#0a0a0b",
        }}
      >
        🐼
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#22c55e",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
