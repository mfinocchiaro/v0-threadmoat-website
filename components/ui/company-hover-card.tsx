"use client"

import { Company, formatCurrency } from "@/lib/company-data"
import { getCustomerLogoUrl, parseKnownCustomers } from "@/lib/customer-logos"
import { normalizeLogoName } from "@/lib/utils"
import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CompanyHoverCardProps {
  company: Company
  onClose?: () => void
  className?: string
}

/** Shared hover/detail card used by Landscape, Periodic Table, and IC Reports. */
export function CompanyHoverCard({ company, onClose, className }: CompanyHoverCardProps) {
  const logoPath = `/logos/${normalizeLogoName(company.name)}/logo_sm.png`
  const initials = company.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
  const customers = parseKnownCustomers(company.knownCustomers)

  const scores = [
    { label: "Weighted",   value: company.weightedScore,       max: 5 },
    { label: "Market Opp", value: company.marketOpportunity,   max: 5 },
    { label: "Tech Diff",  value: company.techDifferentiation, max: 5 },
    { label: "Team Exec",  value: company.teamExecution,        max: 5 },
    { label: "Moat",       value: company.competitiveMoat,      max: 5 },
  ]

  return (
    <div className={cn("w-72 rounded-xl border border-border bg-card shadow-2xl text-sm", className)}>

      {/* ── Header: startup logo + name + location ── */}
      <div className="flex items-start gap-2.5 p-3 border-b border-border">
        <div className="w-9 h-9 shrink-0 rounded bg-muted border border-border overflow-hidden flex items-center justify-center">
          <img
            src={logoPath}
            alt={company.name}
            className="w-full h-full object-contain p-0.5"
            onError={e => {
              e.currentTarget.style.display = "none";
              (e.currentTarget.nextSibling as HTMLElement).style.display = "flex"
            }}
          />
          <span className="hidden w-full h-full items-center justify-center text-[10px] font-bold text-muted-foreground">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {company.url ? (
            <a
              href={company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary hover:underline leading-tight flex items-center gap-1 group"
              onClick={e => e.stopPropagation()}
            >
              <span className="truncate">{company.name}</span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ) : (
            <span className="font-semibold text-foreground leading-tight block truncate">{company.name}</span>
          )}
          <p className="text-xs text-muted-foreground truncate">{company.hqLocation || company.country}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 text-muted-foreground hover:text-foreground text-xl leading-none mt-0.5"
            aria-label="Close"
          >×</button>
        )}
      </div>

      {/* ── Key stats ── */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
        <div className="p-2">
          <p className="text-[10px] text-muted-foreground">Funding</p>
          <p className="font-semibold text-xs">{formatCurrency(company.totalFunding)}</p>
        </div>
        <div className="p-2">
          <p className="text-[10px] text-muted-foreground">Headcount</p>
          <p className="font-semibold text-xs">{company.headcount || "—"}</p>
        </div>
        <div className="p-2">
          <p className="text-[10px] text-muted-foreground">Founded</p>
          <p className="font-semibold text-xs">{company.founded || "—"}</p>
        </div>
      </div>

      {/* ── Score bars ── */}
      <div className="p-3 space-y-1.5 border-b border-border">
        {scores.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-[68px] text-[10px] text-muted-foreground shrink-0">{s.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${((s.value || 0) / s.max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-medium w-6 text-right">{(s.value || 0).toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* ── Badges: round / phase / subsegment ── */}
      <div className="px-3 py-2 flex flex-wrap gap-1 border-b border-border">
        {company.latestFundingRound && (
          <Badge variant="secondary" className="text-[10px] h-5">{company.latestFundingRound}</Badge>
        )}
        {company.startupLifecyclePhase && (
          <Badge variant="outline" className="text-[10px] h-5">{company.startupLifecyclePhase}</Badge>
        )}
        {company.subsegment && (
          <Badge variant="outline" className="text-[10px] h-5 max-w-[160px] truncate">{company.subsegment}</Badge>
        )}
      </div>

      {/* ── Strengths snippet ── */}
      {company.strengths && (
        <div className="px-3 py-2 text-[10px] text-muted-foreground line-clamp-2 border-b border-border">
          <span className="font-medium text-foreground">Strengths: </span>{company.strengths}
        </div>
      )}

      {/* ── Known Customers ── */}
      {customers.length > 0 && (
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Known Customers</p>
          <div className="flex flex-wrap gap-1.5">
            {customers.slice(0, 10).map(name => {
              const logoUrl = getCustomerLogoUrl(name, 48)
              return (
                <div
                  key={name}
                  title={name}
                  className="w-7 h-7 rounded border border-border bg-white dark:bg-muted/50 overflow-hidden flex items-center justify-center"
                >
                  {logoUrl ? (
                    <>
                      <img
                        src={logoUrl}
                        alt={name}
                        className="w-full h-full object-contain p-0.5"
                        onError={e => {
                          e.currentTarget.style.display = "none";
                          (e.currentTarget.nextSibling as HTMLElement).style.display = "flex"
                        }}
                      />
                      <span className="hidden w-full h-full items-center justify-center text-[7px] font-bold text-muted-foreground leading-none text-center px-0.5">
                        {name.slice(0, 3).toUpperCase()}
                      </span>
                    </>
                  ) : (
                    <span className="flex w-full h-full items-center justify-center text-[7px] font-bold text-muted-foreground leading-none text-center px-0.5">
                      {name.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                </div>
              )
            })}
            {customers.length > 10 && (
              <div className="w-7 h-7 rounded border border-border bg-muted/50 flex items-center justify-center text-[8px] text-muted-foreground font-medium">
                +{customers.length - 10}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
