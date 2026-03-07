"use client"

import { useMemo, useEffect, useState } from "react"
import Link from "next/link"
import { Company, formatCurrency, loadCompanyData } from "@/lib/company-data"
import { INVESTMENT_LIST_COLORS } from "@/lib/investment-colors"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

// Domain descriptions and representative icons
const DOMAIN_META: Record<string, { description: string; icon: string }> = {
  "Design Intelligence (CAD)": {
    description:
      "Next-generation computer-aided design tools using AI-driven generative geometry, real-time collaboration, and cloud-native parametric modeling. These startups are redefining how engineers create, iterate, and optimize product designs.",
    icon: "\u270F\uFE0F",
  },
  "Extreme Analysis (CAE, CFD, FEA, QC)": {
    description:
      "Simulation and analysis platforms spanning computational fluid dynamics, finite element analysis, and quality control. GPU-accelerated solvers and AI surrogates are collapsing iteration cycles from days to minutes.",
    icon: "\uD83D\uDD2C",
  },
  "Adaptive Manufacturing (AM, CAM, CNC)": {
    description:
      "Additive manufacturing, CNC optimization, and hybrid production systems. From metal 3D printing to AI-powered toolpath generation, these companies are bridging the digital-to-physical gap.",
    icon: "\uD83C\uDFED",
  },
  "Cognitive Thread (PLM, MBSE, DT)": {
    description:
      "Product lifecycle management, model-based systems engineering, and digital thread platforms. The connective tissue of engineering data \u2014 linking requirements, models, and configurations across the enterprise.",
    icon: "\uD83E\uDDEC",
  },
  "Factory Futures (MES, IIOT)": {
    description:
      "Manufacturing execution systems and industrial IoT platforms enabling smart factory operations. Real-time production monitoring, predictive maintenance, and edge computing for the shop floor.",
    icon: "\u2699\uFE0F",
  },
  "Augmented Operations (MOM, CMMS, AR/VR, SLM)": {
    description:
      "Operations management, maintenance systems, AR/VR-assisted workflows, and service lifecycle management. These tools close the loop between engineering intent and field reality.",
    icon: "\uD83E\uDD7D",
  },
  "Streamlined Supply Chain (SCM)": {
    description:
      "Supply chain management platforms using AI for demand forecasting, supplier risk scoring, and logistics optimization. Critical infrastructure for resilient, data-driven procurement.",
    icon: "\uD83D\uDD17",
  },
  "Bleeding Edge BIM (AEC/BIM)": {
    description:
      "Architecture, engineering, and construction technology \u2014 BIM authoring, clash detection, generative building design, and digital twin platforms for the built environment.",
    icon: "\uD83C\uDFD7\uFE0F",
  },
  "SW+HW=Innovation (Robotics, Drones)": {
    description:
      "Hardware-software convergence: autonomous robotics, drone platforms, sensor fusion, and embodied AI. Companies building the physical intelligence layer for industry.",
    icon: "\uD83E\uDD16",
  },
  "Knowledge Engineering (R&D, Learning)": {
    description:
      "Engineering education, R&D knowledge management, and AI-powered learning platforms. Accelerating how teams capture, share, and apply deep technical expertise.",
    icon: "\uD83C\uDF93",
  },
}

interface DomainStats {
  name: string
  color: string
  count: number
  totalFunding: number
  totalHeadcount: number
  avgScore: number
  topCompanies: { name: string; score: number }[]
  countries: number
  description: string
  icon: string
}

function LandscapeIntroInner() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCompanyData().then(data => { setCompanies(data); setIsLoading(false) })
  }, [])

  const domains = useMemo(() => {
    const grouped = new Map<string, Company[]>()
    for (const c of companies) {
      const il = c.investmentList || "Other"
      if (!grouped.has(il)) grouped.set(il, [])
      grouped.get(il)!.push(c)
    }

    // Build stats in the canonical order from INVESTMENT_LIST_COLORS
    const result: DomainStats[] = []
    for (const [name, color] of Object.entries(INVESTMENT_LIST_COLORS)) {
      if (name === "VC") continue // Skip VC — it's not an investment domain
      const list = grouped.get(name) || []
      if (list.length === 0) continue

      const totalFunding = list.reduce((s, c) => s + (c.totalFunding || 0), 0)
      const totalHeadcount = list.reduce((s, c) => s + (c.headcount || 0), 0)
      const avgScore = list.reduce((s, c) => s + (c.weightedScore || 0), 0) / list.length
      const countries = new Set(list.map((c) => c.country).filter(Boolean)).size

      const topCompanies = [...list]
        .sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0))
        .slice(0, 5)
        .map((c) => ({ name: c.name, score: c.weightedScore || 0 }))

      const meta = DOMAIN_META[name] || { description: "", icon: "\uD83D\uDCCA" }

      result.push({
        name,
        color,
        count: list.length,
        totalFunding,
        totalHeadcount,
        avgScore,
        topCompanies,
        countries,
        description: meta.description,
        icon: meta.icon,
      })
    }

    return result
  }, [companies])

  const totals = useMemo(() => {
    return {
      companies: companies.length,
      funding: companies.reduce((s, c) => s + (c.totalFunding || 0), 0),
      domains: domains.length,
      countries: new Set(companies.map((c) => c.country).filter(Boolean)).size,
    }
  }, [companies, domains])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-full max-w-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Investment Landscape</h1>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed">
          ThreadMoat maps the engineering software ecosystem across ten domains spanning design,
          simulation, manufacturing, operations, supply chain, AEC, robotics, and research systems.
          Each startup is categorized within one primary investment domain.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold">{totals.companies}</p>
          <p className="text-xs text-muted-foreground mt-1">Startups Tracked</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold">{totals.domains}</p>
          <p className="text-xs text-muted-foreground mt-1">Investment Domains</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold">{formatCurrency(totals.funding)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Funding</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold">{totals.countries}</p>
          <p className="text-xs text-muted-foreground mt-1">Countries</p>
        </Card>
      </div>

      {/* Color legend strip */}
      <div className="flex flex-wrap gap-3">
        {domains.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {d.name.replace(/\s*\(.*?\)\s*/g, "")}
            </span>
          </div>
        ))}
      </div>

      {/* Domain cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {domains.map((d) => (
          <Card
            key={d.name}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="h-1.5" style={{ backgroundColor: d.color }} />

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold leading-tight">{d.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {d.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold" style={{ color: d.color }}>
                    {d.count}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Startups</p>
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: d.color }}>
                    {formatCurrency(d.totalFunding)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Funding</p>
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: d.color }}>
                    {d.avgScore.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Avg Score</p>
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: d.color }}>
                    {d.countries}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Countries</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Top-Rated Startups
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {d.topCompanies.map((tc) => (
                    <span
                      key={tc.name}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: d.color + "18",
                        color: d.color,
                        border: `1px solid ${d.color}30`,
                      }}
                    >
                      {tc.name}
                      <span className="opacity-60">{tc.score.toFixed(0)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CTA to explore */}
      <div className="flex justify-center pt-4 pb-8">
        <Link
          href="/dashboard/landscape"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Explore the Full Landscape
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

export default function LandscapeIntroPage() {
  return (
    <VizPageShell>
      <LandscapeIntroInner />
    </VizPageShell>
  )
}
