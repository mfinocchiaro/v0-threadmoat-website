"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Company, formatCurrency } from "@/lib/company-data"
import { useShortlist } from "@/contexts/shortlist-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  X,
  Plus,
  RotateCcw,
  Trash2,
  FileText,
  BarChart3,
  Sparkles,
  AlertTriangle,
  ChevronLeft,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react"
import { jsPDF } from "jspdf"
import { autoTable } from "jspdf-autotable"
import { toPng } from "html-to-image"
import { BubbleChart } from "@/components/charts/bubble-chart"
import { QuadrantChart } from "@/components/charts/quadrant-chart"
import { PeriodicTable } from "@/components/charts/periodic-table"
import { TreemapChart } from "@/components/charts/treemap-chart"

// ─── Types ───────────────────────────────────────────────────────────────────

interface CustomReportTabProps {
  data: Company[]
}

interface ReportSections {
  companyProfile: boolean
  scoreBreakdown: boolean
  aiAnalysis: boolean
  bubbleChart: boolean
  quadrantChart: boolean
  periodicTable: boolean
  treemap: boolean
}

const DEFAULT_SECTIONS: ReportSections = {
  companyProfile: true,
  scoreBreakdown: true,
  aiAnalysis: false,
  bubbleChart: false,
  quadrantChart: false,
  periodicTable: false,
  treemap: false,
}

type SectionKey = keyof ReportSections

interface SectionConfig {
  key: SectionKey
  label: string
  description?: string
  warning?: string
  icon: React.ReactNode
  group: "content" | "charts"
}

const SECTION_OPTIONS: SectionConfig[] = [
  {
    key: "companyProfile",
    label: "Company Profile",
    description: "Overview, financials, strengths & risks",
    icon: <FileText className="h-4 w-4" />,
    group: "content",
  },
  {
    key: "scoreBreakdown",
    label: "Score Breakdown",
    description: "All 7 scoring dimensions with justifications",
    icon: <BarChart3 className="h-4 w-4" />,
    group: "content",
  },
  {
    key: "aiAnalysis",
    label: "AI Analysis",
    description: "LLM-generated narrative deep dive",
    warning: "Uses 1 AI generation per company (10/hour limit)",
    icon: <Sparkles className="h-4 w-4" />,
    group: "content",
  },
  {
    key: "bubbleChart",
    label: "Bubble Chart",
    description: "Funding vs. revenue scatter with score sizing",
    icon: <BarChart3 className="h-4 w-4" />,
    group: "charts",
  },
  {
    key: "quadrantChart",
    label: "Quadrant Chart",
    description: "Market opportunity vs. competitive moat",
    icon: <BarChart3 className="h-4 w-4" />,
    group: "charts",
  },
  {
    key: "periodicTable",
    label: "Periodic Table",
    description: "Category-based company grid layout",
    icon: <BarChart3 className="h-4 w-4" />,
    group: "charts",
  },
  {
    key: "treemap",
    label: "Treemap",
    description: "Funding allocation by segment",
    icon: <BarChart3 className="h-4 w-4" />,
    group: "charts",
  },
]

// ─── AI Narrative Fetch Types ────────────────────────────────────────────────

type NarrativeFetchStatus = "loading" | "complete" | "error" | "rate-limited"

interface NarrativeResult {
  status: NarrativeFetchStatus
  text: string
}

// ─── Report Composition ──────────────────────────────────────────────────────

function score5(val: number): string {
  const bars = Math.round(val)
  return "█".repeat(bars) + "░".repeat(Math.max(0, 5 - bars)) + `  ${val.toFixed(1)}/5`
}

function composeCompanyProfile(company: Company): string {
  const sep = "─".repeat(60)
  return [
    `# ${company.name}`,
    `${company.hqLocation || company.country}  ·  Founded ${company.founded || "N/A"}  ·  ${company.startupLifecyclePhase || company.lifecyclePhase || "N/A"}`,
    `Overall Score: ${company.weightedScore?.toFixed(2) ?? "N/A"} / 5.00`,
    sep,
    "",
    "## Overview",
    company.strengths ? `**Strengths:** ${company.strengths}` : "",
    company.weaknesses ? `**Risks:** ${company.weaknesses}` : "",
    "",
    "## Financials",
    `- Total Funding: ${formatCurrency(company.totalFunding)}`,
    `- Est. Revenue: ${formatCurrency(company.estimatedRevenue)}`,
    `- Est. Market Value: ${formatCurrency(company.estimatedMarketValue)}`,
    `- Headcount: ${company.headcount?.toLocaleString() ?? "N/A"}`,
    `- Latest Round: ${company.latestFundingRound || "N/A"}`,
    company.industriesServed?.length
      ? `\n## Industries Served\n${company.industriesServed.join(", ")}`
      : "",
    company.url ? `\n${company.url}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

function composeScoreBreakdown(company: Company): string {
  const scores = [
    { label: "Market Opportunity", value: company.marketOpportunity, justification: company.marketOpportunityJustification },
    { label: "Team & Execution", value: company.teamExecution, justification: company.teamExecutionJustification },
    { label: "Tech Differentiation", value: company.techDifferentiation, justification: company.techDifferentiationJustification },
    { label: "Funding Efficiency", value: company.fundingEfficiency, justification: company.fundingEfficiencyJustification },
    { label: "Growth Metrics", value: company.growthMetrics, justification: company.growthMetricsJustification },
    { label: "Industry Impact", value: company.industryImpact, justification: company.industryImpactJustification },
    { label: "Competitive Moat", value: company.competitiveMoat, justification: company.competitiveMoatJustification },
  ]

  const rows = scores
    .map((s) => {
      const line = `${s.label.padEnd(22)} ${score5(s.value)}`
      return s.justification ? `${line}\n  → ${s.justification}` : line
    })
    .join("\n")

  return `## Score Breakdown\n\n${rows}`
}

function composeReport(
  companies: Company[],
  sections: ReportSections,
  narrativeCache: Map<string, NarrativeResult>,
): string {
  const parts: string[] = [
    `# Custom Report`,
    `Generated ${new Date().toLocaleDateString()} · ${companies.length} companies`,
    "",
  ]

  for (const company of companies) {
    const companySections: string[] = []

    if (sections.companyProfile) {
      companySections.push(composeCompanyProfile(company))
    } else {
      // Always include a header even without profile
      companySections.push(`# ${company.name}`)
    }

    if (sections.scoreBreakdown) {
      companySections.push(composeScoreBreakdown(company))
    }

    if (sections.aiAnalysis) {
      const cached = narrativeCache.get(company.id)
      if (cached?.status === "complete" && cached.text) {
        companySections.push(`## AI Analysis\n\n${cached.text}`)
      } else if (cached?.status === "error" || cached?.status === "rate-limited") {
        companySections.push(`## AI Analysis\n\n*AI analysis unavailable for this company.*`)
      } else if (cached?.status === "loading") {
        companySections.push(`## AI Analysis\n\n*Loading...*`)
      } else {
        companySections.push(`## AI Analysis\n\n*Not yet generated.*`)
      }
    }

    parts.push(companySections.join("\n\n"))
    parts.push("\n---\n")
  }

  return parts.join("\n")
}

// ─── AI Narrative Section Renderer ───────────────────────────────────────────

function AINarrativePreview({ text }: { text: string }) {
  const sections = useMemo(() => {
    if (!text.trim()) return []
    const parts: { heading: string; body: string }[] = []
    const lines = text.split("\n")
    let currentHeading = ""
    let currentBody: string[] = []

    for (const line of lines) {
      if (line.startsWith("## ")) {
        if (currentHeading || currentBody.length > 0) {
          parts.push({ heading: currentHeading, body: currentBody.join("\n").trim() })
        }
        currentHeading = line.replace(/^## /, "")
        currentBody = []
      } else {
        currentBody.push(line)
      }
    }
    if (currentHeading || currentBody.length > 0) {
      parts.push({ heading: currentHeading, body: currentBody.join("\n").trim() })
    }
    return parts
  }, [text])

  if (sections.length === 0) return null

  return (
    <div className="space-y-3">
      {sections.map((section, i) => (
        <div key={i}>
          {section.heading && (
            <h4 className="text-sm font-bold text-violet-300 mb-1">{section.heading}</h4>
          )}
          {section.body && (
            <div className="text-xs leading-relaxed text-foreground/85 whitespace-pre-wrap">
              {section.body}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── PDF Generation Utilities ────────────────────────────────────────────────

const PDF_PAGE_WIDTH = 210 // A4 mm
const PDF_PAGE_HEIGHT = 297
const PDF_MARGIN = 15
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - 2 * PDF_MARGIN
const PDF_BOTTOM_LIMIT = PDF_PAGE_HEIGHT - PDF_MARGIN - 10

type ChartKey = "bubbleChart" | "quadrantChart" | "periodicTable" | "treemap"

const CHART_LABELS: Record<ChartKey, string> = {
  bubbleChart: "Bubble Chart – Funding vs. Revenue",
  quadrantChart: "Quadrant Chart – Opportunity vs. Moat",
  periodicTable: "Periodic Table – Category Grid",
  treemap: "Treemap – Funding by Segment",
}

/**
 * Markdown→jsPDF renderer.
 * Handles: # H1, ## H2, --- rules, - bullets (with nesting),
 * **bold**, | tables |, ```code blocks```, and plain text.
 */
function renderMarkdownToPDF(
  doc: jsPDF,
  text: string,
  startY: number,
  maxWidth: number,
  leftX: number,
): number {
  let y = startY
  const lines = text.split("\n")
  const lineHeight = 5

  /** Helper: ensure Y is within page bounds, add page if needed */
  function ensureSpace(needed: number = lineHeight): void {
    if (y + needed > PDF_BOTTOM_LIMIT) {
      doc.addPage()
      y = PDF_MARGIN
    }
  }

  /** Detect a markdown table row: starts with | and ends with | */
  function isTableRow(line: string): boolean {
    const trimmed = line.trim()
    return trimmed.startsWith("|") && trimmed.endsWith("|")
  }

  /** Detect separator row: | --- | --- | or |:---|:---| */
  function isSeparatorRow(line: string): boolean {
    return isTableRow(line) && /^\|[\s:]*-{2,}[\s:]*(\|[\s:]*-{2,}[\s:]*)*\|$/.test(line.trim())
  }

  /** Parse a table row into cell strings */
  function parseTableCells(line: string): string[] {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim().replace(/\*\*(.*?)\*\*/g, "$1"))
  }

  let i = 0
  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trimEnd()

    // ─── Fenced code block: ``` ─────────────────────────────────────
    if (line.trimStart().startsWith("```")) {
      i++ // skip opening fence
      const codeLines: string[] = []
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      if (i < lines.length) i++ // skip closing fence

      // Render code block with gray background and monospace font
      doc.setFont("courier", "normal")
      doc.setFontSize(8)
      const codePadding = 3
      const codeLineHeight = 4

      // Calculate total height for background rect
      const wrappedCodeLines: string[][] = codeLines.map((cl) =>
        doc.splitTextToSize(cl || " ", maxWidth - codePadding * 2 - 4)
      )
      const totalCodeHeight =
        wrappedCodeLines.reduce((sum, wl) => sum + wl.length * codeLineHeight, 0) +
        codePadding * 2

      ensureSpace(totalCodeHeight)

      // Draw background rectangle
      doc.setFillColor(240, 240, 240)
      doc.setDrawColor(200, 200, 200)
      doc.roundedRect(leftX, y - 1, maxWidth, totalCodeHeight, 1, 1, "FD")

      y += codePadding
      for (const wrappedGroup of wrappedCodeLines) {
        for (const wl of wrappedGroup) {
          doc.text(wl, leftX + codePadding + 2, y)
          y += codeLineHeight
        }
      }
      y += codePadding

      // Restore normal font
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      continue
    }

    // ─── Markdown table ─────────────────────────────────────────────
    if (isTableRow(line)) {
      const headerCells = parseTableCells(line)
      const bodyRows: string[][] = []
      i++ // move past header row

      // Skip separator row if present
      if (i < lines.length && isSeparatorRow(lines[i])) {
        i++
      }

      // Collect body rows
      while (i < lines.length && isTableRow(lines[i])) {
        if (!isSeparatorRow(lines[i])) {
          bodyRows.push(parseTableCells(lines[i]))
        }
        i++
      }

      // Render with autoTable
      ensureSpace(20) // minimum space for table header
      autoTable(doc, {
        head: [headerCells],
        body: bodyRows,
        startY: y,
        margin: { left: leftX, right: PDF_MARGIN },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [80, 80, 80],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        theme: "grid",
      })

      // Get final Y position after table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable?.finalY ?? y + 20
      y += 4 // spacing after table
      continue
    }

    // ─── Empty line ─────────────────────────────────────────────────
    if (!line) {
      y += lineHeight * 0.6
      ensureSpace()
      i++
      continue
    }

    // ─── Heading: ## Title ──────────────────────────────────────────
    if (line.startsWith("## ")) {
      const heading = line.replace(/^## /, "")
      y += lineHeight * 0.5
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      const wrapped = doc.splitTextToSize(heading, maxWidth)
      for (const wl of wrapped) {
        ensureSpace(lineHeight + 1)
        doc.text(wl, leftX, y)
        y += lineHeight + 1
      }
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      i++
      continue
    }

    // ─── Heading: # Title ───────────────────────────────────────────
    if (line.startsWith("# ")) {
      const heading = line.replace(/^# /, "")
      y += lineHeight * 0.5
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      const wrapped = doc.splitTextToSize(heading, maxWidth)
      for (const wl of wrapped) {
        ensureSpace(lineHeight + 2)
        doc.text(wl, leftX, y)
        y += lineHeight + 2
      }
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      i++
      continue
    }

    // ─── Horizontal rule ────────────────────────────────────────────
    if (line.startsWith("---")) {
      y += 2
      ensureSpace(4)
      doc.setDrawColor(180, 180, 180)
      doc.line(leftX, y, leftX + maxWidth, y)
      y += 4
      i++
      continue
    }

    // ─── Nested bullet: 2+ spaces then - text ──────────────────────
    if (/^ {2,}- /.test(raw)) {
      // Determine nesting depth: each 2 spaces = 1 level
      const leadingSpaces = raw.match(/^( +)/)?.[1].length ?? 0
      const depth = Math.min(Math.floor(leadingSpaces / 2), 3) // max 3 levels
      const indent = 8 + depth * 6
      const bulletText = raw.replace(/^ +- /, "")
      const cleaned = bulletText.replace(/\*\*(.*?)\*\*/g, "$1")
      const wrapped = doc.splitTextToSize(cleaned, maxWidth - indent)
      for (let j = 0; j < wrapped.length; j++) {
        ensureSpace()
        if (j === 0) {
          doc.text(depth === 1 ? "◦" : "▪", leftX + indent - 5, y)
        }
        doc.text(wrapped[j], leftX + indent, y)
        y += lineHeight
      }
      i++
      continue
    }

    // ─── Top-level bullet: - text ───────────────────────────────────
    if (line.startsWith("- ")) {
      const bulletText = line.slice(2)
      const cleaned = bulletText.replace(/\*\*(.*?)\*\*/g, "$1")
      const wrapped = doc.splitTextToSize(cleaned, maxWidth - 8)
      for (let j = 0; j < wrapped.length; j++) {
        ensureSpace()
        if (j === 0) {
          doc.text("•", leftX + 2, y)
        }
        doc.text(wrapped[j], leftX + 8, y)
        y += lineHeight
      }
      i++
      continue
    }

    // ─── Plain or bold text ─────────────────────────────────────────
    const cleaned = line.replace(/\*\*(.*?)\*\*/g, "$1")
    const hasBold = /^\*\*/.test(line)
    if (hasBold) {
      doc.setFont("helvetica", "bold")
    }
    const wrapped = doc.splitTextToSize(cleaned, maxWidth)
    for (const wl of wrapped) {
      ensureSpace()
      doc.text(wl, leftX, y)
      y += lineHeight
    }
    if (hasBold) {
      doc.setFont("helvetica", "normal")
    }
    i++
  }

  return y
}

/** Capture a single chart container to a PNG data URL with timeout handling. */
async function captureChartImage(
  container: HTMLElement,
  chartId: string,
  timeoutMs: number = 10000,
): Promise<string | null> {
  try {
    const result = await Promise.race([
      toPng(container, { pixelRatio: 2, cacheBust: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Chart capture timeout")), timeoutMs),
      ),
    ])
    return result
  } catch (err) {
    console.warn(`[custom-report] Chart capture failed for ${chartId}:`, err)
    return null
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CustomReportTab({ data }: CustomReportTabProps) {
  const { shortlistedCompanies } = useShortlist()

  // Mode: 'configure' or 'preview'
  const [mode, setMode] = useState<"configure" | "preview">("configure")

  // Company selection — pre-populated from shortlist
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([])
  const [initialized, setInitialized] = useState(false)

  // Section toggles
  const [sections, setSections] = useState<ReportSections>({ ...DEFAULT_SECTIONS })

  // Typeahead state
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Report generation state
  const [narrativeCache, setNarrativeCache] = useState<Map<string, NarrativeResult>>(new Map())
  const [isGenerating, setIsGenerating] = useState(false)
  const [showRateLimitConfirm, setShowRateLimitConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Chart capture refs and PDF state
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const bubbleChartRef = useRef<HTMLDivElement>(null)
  const quadrantChartRef = useRef<HTMLDivElement>(null)
  const periodicTableRef = useRef<HTMLDivElement>(null)
  const treemapChartRef = useRef<HTMLDivElement>(null)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  // Pre-populate from shortlist on mount / when shortlist changes
  useEffect(() => {
    if (!initialized && shortlistedCompanies.length > 0) {
      setSelectedCompanies(shortlistedCompanies)
      setInitialized(true)
    }
  }, [shortlistedCompanies, initialized])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Typeahead suggestions — filtered by search, excluding already-selected
  const selectedIds = useMemo(
    () => new Set(selectedCompanies.map((c) => c.id)),
    [selectedCompanies]
  )

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return data
      .filter((c) => !selectedIds.has(c.id) && c.name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [data, searchQuery, selectedIds])

  // ─── Actions ─────────────────────────────────────────────────────────────

  const addCompany = useCallback(
    (company: Company) => {
      if (selectedIds.has(company.id)) return
      setSelectedCompanies((prev) => [...prev, company])
      setSearchQuery("")
      setShowSuggestions(false)
    },
    [selectedIds]
  )

  const removeCompany = useCallback((id: string) => {
    setSelectedCompanies((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setSelectedCompanies([])
  }, [])

  const resetToShortlist = useCallback(() => {
    setSelectedCompanies(shortlistedCompanies)
  }, [shortlistedCompanies])

  const toggleSection = useCallback((key: SectionKey) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleGenerate = useCallback(() => {
    if (selectedCompanies.length === 0) return

    // Check if rate limit confirmation needed
    const aiCount = sections.aiAnalysis ? selectedCompanies.length : 0
    if (aiCount > 5) {
      setShowRateLimitConfirm(true)
      return
    }

    startGeneration()
  }, [selectedCompanies, sections.aiAnalysis]) // eslint-disable-line react-hooks/exhaustive-deps

  const startGeneration = useCallback(async () => {
    setShowRateLimitConfirm(false)
    setMode("preview")
    setCopied(false)

    if (!sections.aiAnalysis) {
      // No AI fetching needed — report is immediate
      return
    }

    setIsGenerating(true)
    const abort = new AbortController()
    abortRef.current = abort

    // Fetch AI narratives sequentially for companies not already cached
    for (const company of selectedCompanies) {
      if (abort.signal.aborted) break

      const existing = narrativeCache.get(company.id)
      if (existing?.status === "complete") continue // use cache

      // Mark as loading
      setNarrativeCache((prev) => {
        const next = new Map(prev)
        next.set(company.id, { status: "loading", text: "" })
        return next
      })

      try {
        const response = await fetch("/api/ai/narrative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: company.id }),
          signal: abort.signal,
        })

        if (!response.ok) {
          const isRateLimit = response.status === 429
          if (isRateLimit) {
            // Rate limited — mark this company and skip remaining
            console.error(`[custom-report] Rate limit hit fetching narrative for ${company.id}`)
            setNarrativeCache((prev) => {
              const next = new Map(prev)
              next.set(company.id, { status: "rate-limited", text: "" })
              return next
            })
            // Mark remaining companies as rate-limited too
            const remaining = selectedCompanies.slice(selectedCompanies.indexOf(company) + 1)
            if (remaining.length > 0) {
              setNarrativeCache((prev) => {
                const next = new Map(prev)
                for (const c of remaining) {
                  if (!next.has(c.id) || next.get(c.id)?.status !== "complete") {
                    next.set(c.id, { status: "rate-limited", text: "" })
                  }
                }
                return next
              })
            }
            break
          }

          // Other error — mark this company, continue with rest
          const errorText = await response.text().catch(() => "Unknown error")
          console.error(`[custom-report] AI narrative error for ${company.id}: ${response.status} ${errorText}`)
          setNarrativeCache((prev) => {
            const next = new Map(prev)
            next.set(company.id, { status: "error", text: "" })
            return next
          })
          continue
        }

        // Stream the response body
        const reader = response.body?.getReader()
        if (!reader) {
          setNarrativeCache((prev) => {
            const next = new Map(prev)
            next.set(company.id, { status: "error", text: "" })
            return next
          })
          continue
        }

        const decoder = new TextDecoder()
        let accumulated = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          // Update progressively
          setNarrativeCache((prev) => {
            const next = new Map(prev)
            next.set(company.id, { status: "loading", text: accumulated })
            return next
          })
        }

        // Mark complete
        setNarrativeCache((prev) => {
          const next = new Map(prev)
          next.set(company.id, { status: "complete", text: accumulated })
          return next
        })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") break
        console.error(`[custom-report] AI narrative fetch failed for ${company.id}:`, err)
        setNarrativeCache((prev) => {
          const next = new Map(prev)
          next.set(company.id, { status: "error", text: "" })
          return next
        })
      }
    }

    setIsGenerating(false)
    abortRef.current = null
  }, [selectedCompanies, sections.aiAnalysis, narrativeCache])

  const handleBackToConfigure = useCallback(() => {
    // Abort any in-flight fetch
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsGenerating(false)
    setMode("configure")
  }, [])

  const handleCopyReport = useCallback(async () => {
    const markdown = composeReport(selectedCompanies, sections, narrativeCache)
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[custom-report] Clipboard write failed:", err)
    }
  }, [selectedCompanies, sections, narrativeCache])

  // ─── Chart capture & PDF generation ──────────────────────────────────────

  const hasAnyChart = sections.bubbleChart || sections.quadrantChart || sections.periodicTable || sections.treemap

  const captureCharts = useCallback(async (): Promise<Map<string, string>> => {
    const captures = new Map<string, string>()
    if (!hasAnyChart) return captures

    const chartRefs: [ChartKey, React.RefObject<HTMLDivElement | null>][] = [
      ["bubbleChart", bubbleChartRef],
      ["quadrantChart", quadrantChartRef],
      ["periodicTable", periodicTableRef],
      ["treemap", treemapChartRef],
    ]

    // Wait for D3 charts to render after mount
    await new Promise((r) => setTimeout(r, 800))

    for (const [chartId, ref] of chartRefs) {
      if (!sections[chartId] || !ref.current) continue
      const dataUrl = await captureChartImage(ref.current, chartId)
      if (dataUrl) {
        captures.set(chartId, dataUrl)
      }
      // Brief delay between captures for D3 stability
      await new Promise((r) => setTimeout(r, 300))
    }

    return captures
  }, [hasAnyChart, sections])

  const handleExportPDF = useCallback(async () => {
    setIsExportingPDF(true)
    setPdfError(null)
    const startTime = performance.now()

    try {
      // 1. Capture chart snapshots if any charts are selected
      const chartImages = await captureCharts()

      // 2. Build the PDF
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      let y = PDF_MARGIN

      // ─── Cover page ───────────────────────────────────────────────
      doc.setFont("helvetica", "bold")
      doc.setFontSize(24)
      doc.text("ThreadMoat Custom Report", PDF_MARGIN, y + 20)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(11)
      y += 32
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, PDF_MARGIN, y)
      y += 7
      doc.text(`Companies: ${selectedCompanies.length}`, PDF_MARGIN, y)
      y += 7

      // Section summary
      const activeSections = SECTION_OPTIONS.filter((s) => sections[s.key]).map((s) => s.label)
      doc.text(`Sections: ${activeSections.join(", ")}`, PDF_MARGIN, y)
      y += 7

      if (chartImages.size > 0) {
        doc.text(`Charts captured: ${chartImages.size}`, PDF_MARGIN, y)
        y += 7
      }

      // Separator
      y += 5
      doc.setDrawColor(100, 100, 100)
      doc.line(PDF_MARGIN, y, PDF_MARGIN + PDF_CONTENT_WIDTH, y)

      // ─── Per-company sections ─────────────────────────────────────
      for (const company of selectedCompanies) {
        doc.addPage()
        y = PDF_MARGIN

        // Company markdown
        const companySections: string[] = []

        if (sections.companyProfile) {
          companySections.push(composeCompanyProfile(company))
        } else {
          companySections.push(`# ${company.name}`)
        }

        if (sections.scoreBreakdown) {
          companySections.push(composeScoreBreakdown(company))
        }

        if (sections.aiAnalysis) {
          const cached = narrativeCache.get(company.id)
          if (cached?.status === "complete" && cached.text) {
            companySections.push(`## AI Analysis\n\n${cached.text}`)
          } else if (cached?.status === "rate-limited") {
            companySections.push(`## AI Analysis\n\n*Rate limit reached — analysis unavailable.*`)
          } else if (cached?.status === "error") {
            companySections.push(`## AI Analysis\n\n*AI analysis unavailable for this company.*`)
          }
        }

        const companyMarkdown = companySections.join("\n\n")
        y = renderMarkdownToPDF(doc, companyMarkdown, y, PDF_CONTENT_WIDTH, PDF_MARGIN)
      }

      // ─── Chart pages ──────────────────────────────────────────────
      if (chartImages.size > 0) {
        for (const [chartId, dataUrl] of chartImages) {
          doc.addPage()
          y = PDF_MARGIN

          // Chart title
          const label = CHART_LABELS[chartId as ChartKey] || chartId
          doc.setFont("helvetica", "bold")
          doc.setFontSize(14)
          doc.text(label, PDF_MARGIN, y)
          y += 10

          // Embed chart image — fit to page width
          const imgWidth = PDF_CONTENT_WIDTH
          const imgHeight = imgWidth * (500 / 800) // maintain 800:500 aspect ratio
          if (y + imgHeight > PDF_BOTTOM_LIMIT) {
            doc.addPage()
            y = PDF_MARGIN
          }
          doc.addImage(dataUrl, "PNG", PDF_MARGIN, y, imgWidth, imgHeight)
          y += imgHeight + 5

          doc.setFont("helvetica", "normal")
          doc.setFontSize(10)
        }
      }

      // Save
      doc.save("threadmoat-report.pdf")

      const elapsed = Math.round(performance.now() - startTime)
      console.log(`[custom-report] PDF generated in ${elapsed}ms (${selectedCompanies.length} companies, ${chartImages.size} charts)`)
    } catch (err) {
      console.error("[custom-report] PDF generation failed:", err)
      setPdfError("PDF generation failed. Use Copy Markdown as a fallback.")
    } finally {
      setIsExportingPDF(false)
    }
  }, [selectedCompanies, sections, narrativeCache, captureCharts])

  // Composed markdown for preview
  const composedMarkdown = useMemo(
    () => composeReport(selectedCompanies, sections, narrativeCache),
    [selectedCompanies, sections, narrativeCache]
  )

  // Derived state
  const hasCompanies = selectedCompanies.length > 0
  const contentSections = SECTION_OPTIONS.filter((s) => s.group === "content")
  const chartSections = SECTION_OPTIONS.filter((s) => s.group === "charts")
  const activeSectionCount = Object.values(sections).filter(Boolean).length
  const aiCompanyCount = sections.aiAnalysis ? selectedCompanies.length : 0

  // ─── Preview mode ────────────────────────────────────────────────────────

  if (mode === "preview") {
    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleBackToConfigure}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to configuration
            </Button>
            <span className="text-xs text-muted-foreground">
              {selectedCompanies.length} companies · {activeSectionCount} sections
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleCopyReport}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Markdown
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating PDF…
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* PDF error message */}
        {pdfError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-800/40 bg-red-950/20 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span className="text-xs text-red-400">{pdfError}</span>
          </div>
        )}

        {/* Per-company AI status badges */}
        {sections.aiAnalysis && (
          <div className="flex flex-wrap gap-2">
            {selectedCompanies.map((company) => {
              const result = narrativeCache.get(company.id)
              const status = result?.status
              return (
                <div
                  key={company.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border",
                    status === "complete" && "bg-emerald-950/40 border-emerald-800/40 text-emerald-400",
                    status === "loading" && "bg-blue-950/40 border-blue-800/40 text-blue-400",
                    status === "error" && "bg-red-950/40 border-red-800/40 text-red-400",
                    status === "rate-limited" && "bg-amber-950/40 border-amber-800/40 text-amber-400",
                    !status && "bg-muted/30 border-border/50 text-muted-foreground"
                  )}
                >
                  {status === "loading" && <Loader2 className="h-3 w-3 animate-spin" />}
                  {status === "complete" && <Check className="h-3 w-3" />}
                  {status === "error" && <AlertCircle className="h-3 w-3" />}
                  {status === "rate-limited" && <AlertTriangle className="h-3 w-3" />}
                  {company.name}
                  {status === "rate-limited" && <span className="text-[10px] opacity-70">rate limited</span>}
                </div>
              )
            })}
            {isGenerating && (
              <span className="text-xs text-muted-foreground self-center ml-1">
                Generating AI narratives…
              </span>
            )}
          </div>
        )}

        {/* Report content */}
        <div className="rounded-xl border border-border/50 bg-muted/10 max-h-[600px] overflow-y-auto">
          <div className="p-5 space-y-6">
            {selectedCompanies.map((company) => (
              <div key={company.id} className="space-y-4">
                {/* Company header */}
                <div className="border-b border-border/30 pb-3">
                  <h2 className="text-lg font-bold">{company.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {company.hqLocation || company.country} · Founded{" "}
                    {company.founded || "N/A"} ·{" "}
                    {company.startupLifecyclePhase || company.lifecyclePhase || "N/A"}
                    <span className="ml-2 text-primary font-semibold">
                      {company.weightedScore?.toFixed(2)} / 5.00
                    </span>
                  </p>
                </div>

                {/* Company Profile */}
                {sections.companyProfile && (
                  <div className="space-y-3">
                    {company.strengths && (
                      <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-3">
                        <div className="text-xs font-semibold uppercase text-emerald-400 mb-1">
                          Strengths
                        </div>
                        <p className="text-xs leading-relaxed">{company.strengths}</p>
                      </div>
                    )}
                    {company.weaknesses && (
                      <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-3">
                        <div className="text-xs font-semibold uppercase text-red-400 mb-1">
                          Risks
                        </div>
                        <p className="text-xs leading-relaxed">{company.weaknesses}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          ["Total Funding", formatCurrency(company.totalFunding)],
                          ["Est. Revenue", formatCurrency(company.estimatedRevenue)],
                          ["Est. Market Value", formatCurrency(company.estimatedMarketValue)],
                          ["Headcount", company.headcount?.toLocaleString() ?? "N/A"],
                        ] as const
                      ).map(([label, val]) => (
                        <div key={label} className="bg-muted/40 rounded-lg p-2">
                          <div className="text-[10px] text-muted-foreground">{label}</div>
                          <div className="text-xs font-semibold text-primary mt-0.5">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score Breakdown */}
                {sections.scoreBreakdown && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Score Breakdown
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: "Market Opportunity", value: company.marketOpportunity, justification: company.marketOpportunityJustification },
                        { label: "Team & Execution", value: company.teamExecution, justification: company.teamExecutionJustification },
                        { label: "Tech Differentiation", value: company.techDifferentiation, justification: company.techDifferentiationJustification },
                        { label: "Funding Efficiency", value: company.fundingEfficiency, justification: company.fundingEfficiencyJustification },
                        { label: "Growth Metrics", value: company.growthMetrics, justification: company.growthMetricsJustification },
                        { label: "Industry Impact", value: company.industryImpact, justification: company.industryImpactJustification },
                        { label: "Competitive Moat", value: company.competitiveMoat, justification: company.competitiveMoatJustification },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{row.label}</span>
                            <span className="font-semibold">{row.value.toFixed(1)}/5</span>
                          </div>
                          {row.justification && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                              {row.justification}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {sections.aiAnalysis && (() => {
                  const result = narrativeCache.get(company.id)
                  if (!result) return null
                  if (result.status === "loading" && result.text) {
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-xs font-semibold uppercase text-violet-400">
                            AI Analysis
                          </div>
                          <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                        </div>
                        <AINarrativePreview text={result.text} />
                      </div>
                    )
                  }
                  if (result.status === "loading") {
                    return (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Generating AI analysis…
                      </div>
                    )
                  }
                  if (result.status === "complete" && result.text) {
                    return (
                      <div>
                        <div className="text-xs font-semibold uppercase text-violet-400 mb-2">
                          AI Analysis
                        </div>
                        <AINarrativePreview text={result.text} />
                      </div>
                    )
                  }
                  if (result.status === "rate-limited") {
                    return (
                      <div className="flex items-center gap-2 text-xs text-amber-400 py-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Rate limit reached — AI analysis unavailable
                      </div>
                    )
                  }
                  if (result.status === "error") {
                    return (
                      <div className="flex items-center gap-2 text-xs text-red-400 py-2">
                        <AlertCircle className="h-3.5 w-3.5" />
                        AI analysis unavailable for this company
                      </div>
                    )
                  }
                  return null
                })()}

                {/* Company separator */}
                <div className="border-t border-border/20 pt-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Hidden offscreen chart container for PDF capture */}
        {hasAnyChart && (
          <div
            ref={chartContainerRef}
            style={{
              position: "fixed",
              left: "-9999px",
              top: 0,
              visibility: "hidden",
              width: "800px",
              height: "500px",
              overflow: "hidden",
              background: "#09090b", // dark bg matching theme
            }}
          >
            {sections.bubbleChart && (
              <div ref={bubbleChartRef} style={{ width: 800, height: 500 }}>
                <BubbleChart data={selectedCompanies} shortlistedIds={selectedIds} />
              </div>
            )}
            {sections.quadrantChart && (
              <div ref={quadrantChartRef} style={{ width: 800, height: 500 }}>
                <QuadrantChart data={selectedCompanies} shortlistedIds={selectedIds} />
              </div>
            )}
            {sections.periodicTable && (
              <div ref={periodicTableRef} style={{ width: 800, height: 500 }}>
                <PeriodicTable data={selectedCompanies} shortlistedIds={selectedIds} />
              </div>
            )}
            {sections.treemap && (
              <div ref={treemapChartRef} style={{ width: 800, height: 500 }}>
                <TreemapChart data={selectedCompanies} shortlistedIds={selectedIds} />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Rate Limit Confirmation Modal ───────────────────────────────────────

  if (showRateLimitConfirm) {
    const aiCount = selectedCompanies.length
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-semibold">High AI Usage Warning</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This will use <span className="text-amber-400 font-semibold">{aiCount}</span> of your{" "}
            <span className="font-semibold">10 AI generations per hour</span>. Are you sure you
            want to proceed?
          </p>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={startGeneration} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Proceed
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRateLimitConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Configure mode ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Company Selection ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Companies{" "}
            {hasCompanies && (
              <span className="text-primary">({selectedCompanies.length} selected)</span>
            )}
          </label>
          <div className="flex gap-1.5">
            {shortlistedCompanies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={resetToShortlist}
              >
                <RotateCcw className="h-3 w-3" />
                Reset to shortlist
              </Button>
            )}
            {hasCompanies && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-red-400 hover:text-red-300 hover:bg-red-950/40"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Selected company chips */}
        {hasCompanies && (
          <div className="flex flex-wrap gap-1.5">
            {selectedCompanies.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {c.name}
                <button
                  onClick={() => removeCompany(c.id)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Typeahead search */}
        <div className="relative max-w-sm" ref={searchContainerRef}>
          <Input
            placeholder="Search and add a company..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              if (searchQuery) setShowSuggestions(true)
            }}
            className="h-9 pr-8"
          />
          <Plus className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
              {suggestions.map((c) => (
                <button
                  key={c.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2"
                  onMouseDown={() => addCompany(c)}
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {c.weightedScore?.toFixed(1)} · {c.country}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!hasCompanies && (
          <p className="text-xs text-muted-foreground">
            {shortlistedCompanies.length > 0
              ? "Your shortlist will be loaded automatically. You can also search for additional companies."
              : "Search and add companies to include in your report."}
          </p>
        )}
      </div>

      {/* ── Report Sections ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Report Sections
        </label>

        {/* Content sections */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Per-Company Content
          </div>
          <div className="space-y-2">
            {contentSections.map((section) => (
              <SectionCheckbox
                key={section.key}
                section={section}
                checked={sections[section.key]}
                onToggle={() => toggleSection(section.key)}
              />
            ))}
          </div>
        </div>

        {/* Chart sections */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Comparative Charts
          </div>
          <div className="space-y-2">
            {chartSections.map((section) => (
              <SectionCheckbox
                key={section.key}
                section={section}
                checked={sections[section.key]}
                onToggle={() => toggleSection(section.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Generate Button ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerate}
          disabled={!hasCompanies}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Generate Report
          {!hasCompanies && (
            <span className="text-xs opacity-60 ml-1">(select companies first)</span>
          )}
        </Button>
        {hasCompanies && (
          <span className="text-xs text-muted-foreground">
            {selectedCompanies.length} companies · {activeSectionCount} sections
            {aiCompanyCount > 0 && (
              <span className="text-amber-400 ml-1">
                · {aiCompanyCount} AI generation{aiCompanyCount !== 1 ? "s" : ""}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Section Checkbox Row ────────────────────────────────────────────────────

function SectionCheckbox({
  section,
  checked,
  onToggle,
}: {
  section: SectionConfig
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors cursor-pointer hover:bg-muted/40",
        checked && "bg-muted/30 border-border/50"
      )}
      onClick={onToggle}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle()}
        className="mt-0.5"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{section.icon}</span>
          <Label className="text-sm font-medium cursor-pointer">
            {section.label}
          </Label>
        </div>
        {section.description && (
          <p className="text-xs text-muted-foreground mt-0.5 ml-6">
            {section.description}
          </p>
        )}
        {section.warning && checked && (
          <div className="flex items-center gap-1.5 mt-1.5 ml-6">
            <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400">{section.warning}</p>
          </div>
        )}
      </div>
    </div>
  )
}
