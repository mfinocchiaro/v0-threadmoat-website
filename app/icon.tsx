import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e1b3a 0%, #2a2344 100%)",
          borderRadius: 6,
        }}
      >
        {/* Stylized T with gradient stripe matching the ThreadMoat logo */}
        <svg width="24" height="24" viewBox="0 0 24 24">
          {/* Gradient definition */}
          <defs>
            <linearGradient id="tg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          {/* T crossbar */}
          <rect x="2" y="4" width="20" height="3.5" rx="1" fill="white" />
          {/* T stem */}
          <rect x="9" y="4" width="5.5" height="17" rx="1" fill="white" />
          {/* Diagonal gradient stripe (the ThreadMoat slash) */}
          <line
            x1="3"
            y1="2"
            x2="21"
            y2="12"
            stroke="url(#tg)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  )
}
