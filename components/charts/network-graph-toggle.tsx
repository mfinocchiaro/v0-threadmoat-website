"use client"

import { useState } from "react"
import { Company } from "@/lib/company-data"
import { NetworkGraph } from "./network-graph"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Box, Grid2x2 } from "lucide-react"
import { cn } from "@/lib/utils"

const NetworkGraph3D = dynamic(
  () => import("./network-graph-3d").then(m => m.NetworkGraph3D),
  { ssr: false, loading: () => <Skeleton className="w-full min-h-[500px] rounded-lg" /> }
)

interface NetworkGraphToggleProps {
  data: Company[]
  className?: string
  preview?: boolean
}

export function NetworkGraphToggle({ data, className, preview = false }: NetworkGraphToggleProps) {
  const [mode, setMode] = useState<"2d" | "3d">("2d")

  if (preview) {
    return <NetworkGraph data={data} className={className} preview />
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-1 mb-2">
        <Button
          variant={mode === "2d" ? "default" : "outline"}
          size="sm"
          className={cn("h-7 px-3 text-xs", mode === "2d" && "pointer-events-none")}
          onClick={() => setMode("2d")}
        >
          <Grid2x2 className="size-3 mr-1" />
          2D
        </Button>
        <Button
          variant={mode === "3d" ? "default" : "outline"}
          size="sm"
          className={cn("h-7 px-3 text-xs", mode === "3d" && "pointer-events-none")}
          onClick={() => setMode("3d")}
        >
          <Box className="size-3 mr-1" />
          3D
        </Button>
      </div>
      {mode === "2d" ? (
        <NetworkGraph data={data} className={className} />
      ) : (
        <NetworkGraph3D data={data} className={className} />
      )}
    </div>
  )
}
