"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Maximize2 } from "lucide-react"
import { ReactNode } from "react"

interface ChartCardProps {
  title: string
  subtitle?: string
  href: string
  icon?: React.ElementType
  children: ReactNode
  className?: string
  /** Height class for the chart area (default: h-[300px]) */
  chartHeight?: string
}

export function ChartCard({
  title,
  subtitle,
  href,
  icon: Icon,
  children,
  className,
  chartHeight = "h-[300px]",
}: ChartCardProps) {
  return (
    <Card className={cn("group relative overflow-hidden transition-colors hover:border-primary/30", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            {Icon && <Icon className="size-4 text-muted-foreground shrink-0" />}
            <div>
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <Link
            href={href}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
            title="Open full view"
          >
            <Maximize2 className="size-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <Link href={href} className="block">
          <div className={cn("rounded-lg overflow-hidden", chartHeight)}>
            {children}
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}
