import React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Explore — ThreadMoat",
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-sm flex items-center px-6 justify-between">
        <a href="/" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">ThreadMoat</a>
        <a href="/pricing" className="text-sm text-primary hover:underline">Unlock full analytics →</a>
      </header>
      <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-[11px] text-amber-700 dark:text-amber-400">
        Research estimates only — figures are educated approximations from public sources and may contain errors. Not investment advice. Always conduct your own due diligence.
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </div>
    </div>
  )
}
