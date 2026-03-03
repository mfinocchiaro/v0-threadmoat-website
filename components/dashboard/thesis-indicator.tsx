"use client"

import { Badge } from "@/components/ui/badge"
import { X, Focus } from "lucide-react"
import { useThesisOptional } from "@/contexts/thesis-context"

interface ThesisIndicatorProps {
  onEditThesis: () => void
}

export function ThesisIndicator({ onEditThesis }: ThesisIndicatorProps) {
  const ctx = useThesisOptional()

  if (!ctx || !ctx.activeThesis || !ctx.activeConfig) return null

  const { activeConfig, clearThesis } = ctx

  return (
    <Badge
      variant="secondary"
      className="cursor-pointer gap-1.5 pl-2 pr-1 py-1 hover:bg-secondary/80"
      onClick={onEditThesis}
    >
      <Focus className="h-3 w-3" />
      <span>{activeConfig.indicatorLabel}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          clearThesis()
        }}
        className="ml-0.5 rounded-full p-0.5 hover:bg-background/50"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}
