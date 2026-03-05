import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ThreadMoat - Industrial AI & Engineering Software Intelligence',
  description: 'Navigate the future of Industrial AI & Engineering Software. Access 300+ startup profiles, 35+ years of PLM market expertise, and warm introductions to 100+ founders.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {/* Global conference announcement bar */}
        <div className="w-full bg-primary text-primary-foreground text-center text-sm px-4 py-2">
          <span>Join us at Threaded at Develop3D Live — March&nbsp;25,&nbsp;2026 — Warwick Arts Centre</span>
          <span className="ml-2">
            <a
              href="https://threaded.live"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Save your spot
            </a>
          </span>
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
