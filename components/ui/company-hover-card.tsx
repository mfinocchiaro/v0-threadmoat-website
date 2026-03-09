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

/** Small logo icon + name chip — always readable, logo is a bonus. */
function CustomerChip({ name }: { name: string }) {
  const logoUrl = getCustomerLogoUrl(name, 32)
  return (
    <div className="flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 max-w-[140px]">
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          style={{ width: 13, height: 13, objectFit: "contain", flexShrink: 0, display: "block" }}
          onError={e => { e.currentTarget.style.display = "none" }}
        />
      )}
      <span className="text-[10px] text-foreground/80 truncate leading-tight">{name}</span>
    </div>
  )
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
        <div className="w-9 h-9 shrink-0 rounded bg-muted border border-border overflow-hidden flex items-center justify-center relative">
          <img
            src={logoPath}
            alt={company.name}
            className="w-full h-full object-contain p-0.5"
            onError={e => { e.currentTarget.style.display = "none" }}
          />
          {/* initials always rendered underneath — visible if img hides itself */}
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground -z-10">
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
              <div className="h-full rounded-full bg-primary" style={{ width: `${((s.value || 0) / s.max) * 100}%` }} />
            </div>
            <span className="text-[10px] font-medium w-6 text-right">{(s.value || 0).toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* ── Badges ── */}
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

      {/* ── Known Customers — named chips, logo is a bonus prefix ── */}
      {customers.length > 0 && (
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Known Customers</p>
          <div className="flex flex-wrap gap-1">
            {customers.slice(0, 12).map(name => (
              <CustomerChip key={name} name={name} />
            ))}
            {customers.length > 12 && (
              <span className="text-[10px] text-muted-foreground self-center">+{customers.length - 12} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
