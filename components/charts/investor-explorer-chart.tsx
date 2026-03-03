"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { Company } from "@/lib/company-data"
import { formatCurrency } from "@/lib/company-data"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronRight, Search, ArrowUpDown } from "lucide-react"

interface InvestorExplorerChartProps {
  data: Company[]
  className?: string
}

interface InvestorRow {
  name: string
  startups: Company[]
  startupCount: number
  investmentLists: string[]
  totalFunding: number
  avgScore: number
}

type SortField = "startupCount" | "totalFunding" | "avgScore" | "name"

export function InvestorExplorerChart({ data, className }: InvestorExplorerChartProps) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("startupCount")
  const [sortAsc, setSortAsc] = useState(false)
  const [expandedInvestor, setExpandedInvestor] = useState<string | null>(null)
  const [minStartups, setMinStartups] = useState("1")

  const investors = useMemo(() => {
    const map = new Map<string, InvestorRow>()

    data.forEach((company) => {
      if (!company.investors || company.investors.length === 0) return

      company.investors.forEach((investor) => {
        const existing = map.get(investor)
        if (existing) {
          existing.startups.push(company)
          existing.startupCount += 1
          existing.totalFunding += company.totalFunding || 0
          if (company.investmentList && !existing.investmentLists.includes(company.investmentList)) {
            existing.investmentLists.push(company.investmentList)
          }
        } else {
          map.set(investor, {
            name: investor,
            startups: [company],
            startupCount: 1,
            totalFunding: company.totalFunding || 0,
            investmentLists: company.investmentList ? [company.investmentList] : [],
            avgScore: 0,
          })
        }
      })
    })

    // Calculate avg scores
    map.forEach((row) => {
      const scores = row.startups.map((c) => c.weightedScore).filter((s) => s > 0)
      row.avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    })

    return Array.from(map.values())
  }, [data])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const min = parseInt(minStartups) || 1

    return investors
      .filter((inv) => inv.startupCount >= min)
      .filter((inv) => !q || inv.name.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortField === "name") {
          return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        }
        return sortAsc ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
      })
  }, [investors, search, sortField, sortAsc, minStartups])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className={cn("h-3 w-3", sortField === field ? "text-primary" : "text-muted-foreground/40")} />
    </button>
  )

  // Summary stats
  const totalInvestors = filtered.length
  const multiDealInvestors = filtered.filter((i) => i.startupCount >= 2).length

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/60 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Investors Found</div>
          <div className="text-2xl font-bold">{totalInvestors}</div>
        </div>
        <div className="bg-card border border-border/60 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Multi-Deal Investors</div>
          <div className="text-2xl font-bold">{multiDealInvestors}</div>
        </div>
        <div className="bg-card border border-border/60 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Companies w/ Investors</div>
          <div className="text-2xl font-bold">{data.filter((c) => c.investors?.length > 0).length}</div>
        </div>
        <div className="bg-card border border-border/60 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Total Portfolio Funding</div>
          <div className="text-2xl font-bold">{formatCurrency(data.reduce((s, c) => s + (c.totalFunding || 0), 0))}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search investors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Min. startups</Label>
          <Select value={minStartups} onValueChange={setMinStartups}>
            <SelectTrigger className="w-28 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="max-h-[650px] border border-border/60 rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>
                <SortHeader field="name">Investor</SortHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortHeader field="startupCount">Startups</SortHeader>
              </TableHead>
              <TableHead>Investment Lists</TableHead>
              <TableHead className="text-right">
                <SortHeader field="totalFunding">Total Funding</SortHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortHeader field="avgScore">Avg Score</SortHeader>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => {
              const isExpanded = expandedInvestor === inv.name
              return (
                <TableRow
                  key={inv.name}
                  className="cursor-pointer group"
                  onClick={() => setExpandedInvestor(isExpanded ? null : inv.name)}
                >
                  <TableCell className="w-8 pr-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{inv.name}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{inv.startupCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {inv.investmentLists.slice(0, 3).map((list) => (
                        <Badge key={list} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {list.length > 25 ? list.slice(0, 23) + "…" : list}
                        </Badge>
                      ))}
                      {inv.investmentLists.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{inv.investmentLists.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(inv.totalFunding)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {inv.avgScore > 0 ? inv.avgScore.toFixed(2) : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No investors match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Expanded detail panel */}
      {expandedInvestor && (() => {
        const inv = filtered.find((i) => i.name === expandedInvestor)
        if (!inv) return null
        return (
          <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{inv.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {inv.startupCount} startup{inv.startupCount !== 1 ? "s" : ""} &middot;{" "}
                  {formatCurrency(inv.totalFunding)} total funding &middot; Avg score: {inv.avgScore.toFixed(2)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedInvestor(null) }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            {/* Investment Lists */}
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Investment Lists Covered</p>
              <div className="flex flex-wrap gap-1.5">
                {inv.investmentLists.map((list) => (
                  <Badge key={list} variant="secondary" className="text-xs">
                    {list}
                  </Badge>
                ))}
                {inv.investmentLists.length === 0 && (
                  <span className="text-xs text-muted-foreground">None specified</span>
                )}
              </div>
            </div>

            {/* Startups */}
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Portfolio Companies</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {inv.startups
                  .sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0))
                  .map((c) => (
                    <div key={c.id} className="bg-background/60 border border-border/40 rounded-lg p-2.5 space-y-0.5">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-xs">{c.name}</span>
                        <span className="text-xs font-bold text-primary">{c.weightedScore?.toFixed(1) || "—"}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.investmentList || "N/A"} &middot; {c.country || "Unknown"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.latestFundingRound || c.startupLifecyclePhase || "N/A"} &middot;{" "}
                        {formatCurrency(c.totalFunding)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
