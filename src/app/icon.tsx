import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #16a34a22, #15803d11)",
          border: "1px solid #22c55e33",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontSize: 20,
        }}
      >
        🐼
        {/* green accent dot */}
        <div
          style={{
            position: "absolute",
            top: 1,
            right: 1,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#22c55e",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
