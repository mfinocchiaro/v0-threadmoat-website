"use client"

import { useMemo, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { Company, Investor } from "@/lib/company-data"
import { formatCurrency, loadInvestorData } from "@/lib/company-data"
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
import { getInvestmentColor } from "@/lib/investment-colors"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  investorType: string
  linkedInProfile: string
  contacts: string
}

type SortField = "startupCount" | "totalFunding" | "avgScore" | "name"

export function InvestorExplorerChart({ data, className }: InvestorExplorerChartProps) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("startupCount")
  const [sortAsc, setSortAsc] = useState(false)
  const [expandedInvestor, setExpandedInvestor] = useState<string | null>(null)
  const [minStartups, setMinStartups] = useState("1")
  const [investorTypeFilter, setInvestorTypeFilter] = useState("all")
  const [investorCsv, setInvestorCsv] = useState<Investor[]>([])

  useEffect(() => {
    loadInvestorData().then(setInvestorCsv)
  }, [])

  const investorLookup = useMemo(() => {
    const map = new Map<string, Investor>()
    for (const inv of investorCsv) {
      map.set(inv.name.toLowerCase(), inv)
    }
    return map
  }, [investorCsv])

  const investors = useMemo(() => {
    const map = new Map<string, InvestorRow>()

    const EXCLUDED_INVESTORS = ["bootstrapped", "angel funded", "undisclosed", "unknown", "n a", "n/a"]

    data.forEach((company) => {
      if (!company.investors || company.investors.length === 0) return

      company.investors
        .filter((inv) => {
          const lower = inv.toLowerCase().trim()
          if (EXCLUDED_INVESTORS.includes(lower)) return false
          // Filter out raw Airtable dict fragments
          if (inv.includes("'state'") || inv.includes("'isStale'") || inv.includes("'value'") || inv.startsWith("{") || inv.endsWith("}")) return false
          return true
        })
        .forEach((investor) => {
        const existing = map.get(investor)
        if (existing) {
          existing.startups.push(company)
          existing.startupCount += 1
          existing.totalFunding += company.totalFunding || 0
          if (company.investmentList && !existing.investmentLists.includes(company.investmentList)) {
            existing.investmentLists.push(company.investmentList)
          }
        } else {
          const csvRow = investorLookup.get(investor.toLowerCase())
          map.set(investor, {
            name: investor,
            startups: [company],
            startupCount: 1,
            totalFunding: company.totalFunding || 0,
            investmentLists: company.investmentList ? [company.investmentList] : [],
            avgScore: 0,
            investorType: csvRow?.investorType || "",
            linkedInProfile: csvRow?.linkedInProfile || "",
            contacts: csvRow?.contacts || "",
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
  }, [data, investorLookup])

  const investorTypes = useMemo(() => {
    const types = new Set(investors.map(i => i.investorType).filter(Boolean))
    return Array.from(types).sort()
  }, [investors])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const min = parseInt(minStartups) || 1

    return investors
      .filter((inv) => inv.startupCount >= min)
      .filter((inv) => !q || inv.name.toLowerCase().includes(q))
      .filter((inv) => investorTypeFilter === "all" || inv.investorType === investorTypeFilter)
      .sort((a, b) => {
        if (sortField === "name") {
          return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        }
        return sortAsc ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
      })
  }, [investors, search, sortField, sortAsc, minStartups, investorTypeFilter])

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
        {investorTypes.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={investorTypeFilter} onValueChange={setInvestorTypeFilter}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {investorTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
              <TableHead>Type</TableHead>
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
                  <TableCell className="font-medium text-sm">
                    {inv.linkedInProfile ? (
                      <a href={inv.linkedInProfile} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {inv.name}
                      </a>
                    ) : inv.name}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{inv.startupCount}</TableCell>
                  <TableCell>
                    {inv.investorType && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                        {inv.investorType}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {inv.investmentLists.slice(0, 3).map((list) => {
                        const color = getInvestmentColor(list)
                        return (
                          <Badge
                            key={list}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 border"
                            style={{ backgroundColor: color + "20", color, borderColor: color + "40" }}
                          >
                            {list.length > 25 ? list.slice(0, 23) + "…" : list}
                          </Badge>
                        )
                      })}
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No investors match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Expanded detail dialog */}
      {(() => {
        const inv = expandedInvestor ? filtered.find((i) => i.name === expandedInvestor) : null
        return (
          <Dialog open={!!inv} onOpenChange={() => setExpandedInvestor(null)}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              {inv && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-lg flex items-center gap-2">
                      {inv.linkedInProfile ? (
                        <a href={inv.linkedInProfile} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                          {inv.name}
                        </a>
                      ) : inv.name}
                      {inv.investorType && (
                        <Badge variant="outline" className="text-xs font-normal">{inv.investorType}</Badge>
                      )}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {inv.startupCount} startup{inv.startupCount !== 1 ? "s" : ""} &middot;{" "}
                      {formatCurrency(inv.totalFunding)} total funding &middot; Avg score: {inv.avgScore.toFixed(2)}
                      {inv.contacts && <> &middot; Contact: {inv.contacts}</>}
                    </p>
                  </DialogHeader>

                  <div className="space-y-4 mt-2">
                    {/* Investment Lists */}
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Investment Lists Covered</p>
                      <div className="flex flex-wrap gap-1.5">
                        {inv.investmentLists.map((list) => {
                          const color = getInvestmentColor(list)
                          return (
                            <Badge
                              key={list}
                              variant="secondary"
                              className="text-xs border"
                              style={{ backgroundColor: color + "20", color, borderColor: color + "40" }}
                            >
                              {list}
                            </Badge>
                          )
                        })}
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
                            <div key={c.id} className="bg-muted border border-border rounded-lg p-2.5 space-y-0.5">
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
                </>
              )}
            </DialogContent>
          </Dialog>
        )
      })()}
    </div>
  )
}
