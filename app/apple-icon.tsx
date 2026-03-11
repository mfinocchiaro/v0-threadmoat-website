import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e1b3a 0%, #2a2344 100%)",
          borderRadius: 36,
        }}
      >
        <svg width="130" height="130" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="tg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <rect x="2" y="4" width="20" height="3.5" rx="1" fill="white" />
          <rect x="9" y="4" width="5.5" height="17" rx="1" fill="white" />
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
