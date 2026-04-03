"use client"

import { useState } from "react"
import { Company, formatCurrency } from "@/lib/company-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { CompanyDetailsDialog } from "@/components/company-details-dialog"
import { ExternalLink, Building2 } from "lucide-react"

export interface CellDrilldownData {
  label: string
  companyIds: string[]
}

interface CellDrilldownDialogProps {
  cell: CellDrilldownData | null
  allData: Company[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CellDrilldownDialog({ cell, allData, open, onOpenChange }: CellDrilldownDialogProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  if (!cell) return null

  const idSet = new Set(cell.companyIds)
  const companies = allData
    .filter(c => idSet.has(c.id))
    .sort((a, b) => (b.totalFunding || 0) - (a.totalFunding || 0))

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              {cell.label}
            </DialogTitle>
            <DialogDescription>
              {companies.length} startup{companies.length !== 1 ? "s" : ""} in this cell
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="px-6 py-2 h-[400px]">
            <div className="space-y-3 pb-6">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="group p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted hover:border-muted-foreground/30 transition-all cursor-pointer"
                  onClick={() => setSelectedCompany(company)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1 pr-2">
                      {company.name}
                    </h4>
                    {company.totalFunding > 0 && (
                      <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                        {formatCurrency(company.totalFunding)}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1 mb-2">
                    {company.subsegment}{company.startupLifecyclePhase ? ` • ${company.startupLifecyclePhase}` : ""}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCompany(company)
                      }}
                    >
                      View Details
                    </Button>
                    {company.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 size-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(company.url, "_blank")
                        }}
                      >
                        <ExternalLink className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <CompanyDetailsDialog
        company={selectedCompany}
        open={!!selectedCompany}
        onOpenChange={(open) => { if (!open) setSelectedCompany(null) }}
      />
    </>
  )
}
