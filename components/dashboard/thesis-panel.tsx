"use client"

import { useState, useEffect, useTransition } from "react"
import { Company } from "@/lib/company-data"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  useThesis, ThesisType, VCThesis, ISVThesis, OEMThesis,
  PROFILE_THESIS_CONFIG, ProfileThesisConfig,
} from "@/contexts/thesis-context"
import { VCStep } from "@/components/dashboard/thesis-steps/vc-step"
import { ISVStep } from "@/components/dashboard/thesis-steps/isv-step"
import { OEMStep } from "@/components/dashboard/thesis-steps/oem-step"

interface ThesisPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: Company[]
  profileType?: string
  isAdmin?: boolean
}

function profileToThesisType(profileType?: string): ThesisType {
  const config = profileType ? PROFILE_THESIS_CONFIG[profileType] : undefined
  return config?.thesisType ?? "vc"
}

function getConfig(profileType?: string): ProfileThesisConfig {
  if (profileType && PROFILE_THESIS_CONFIG[profileType]) return PROFILE_THESIS_CONFIG[profileType]
  return PROFILE_THESIS_CONFIG["vc_investor"]
}

export function ThesisPanel({ open, onOpenChange, companies, profileType }: ThesisPanelProps) {
  const {
    vcThesis, isvThesis, oemThesis,
    applyThesis, clearThesis, activeThesis,
  } = useThesis()

  const config = getConfig(profileType)
  const defaultType = profileToThesisType(profileType)

  // Draft state
  const [draftVC, setDraftVC] = useState<VCThesis>(vcThesis)
  const [draftISV, setDraftISV] = useState<ISVThesis>(isvThesis)
  const [draftOEM, setDraftOEM] = useState<OEMThesis>(oemThesis)

  useEffect(() => {
    if (open) {
      setDraftVC(vcThesis)
      setDraftISV(isvThesis)
      setDraftOEM(oemThesis)
    }
  }, [open, vcThesis, isvThesis, oemThesis])

  const [isPending, startTransition] = useTransition()

  function handleApply() {
    onOpenChange(false)
    startTransition(() => {
      applyThesis(defaultType, { vc: draftVC, isv: draftISV, oem: draftOEM })
    })
  }

  function handleClear() {
    clearThesis()
    onOpenChange(false)
  }

  function renderForm() {
    switch (defaultType) {
      case "founder":
        return <VCStep thesis={draftVC} onChange={setDraftVC} companies={companies} variant="founder" />
      case "vc":
        return <VCStep thesis={draftVC} onChange={setDraftVC} companies={companies} variant="investor" />
      case "isv":
        return <ISVStep thesis={draftISV} onChange={setDraftISV} companies={companies} />
      case "oem":
        return <OEMStep thesis={draftOEM} onChange={setDraftOEM} companies={companies} />
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl w-full flex flex-col overflow-hidden">
        <SheetHeader className="shrink-0">
          <SheetTitle>{config.sheetTitle}</SheetTitle>
          <SheetDescription>{config.sheetDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="px-1 pb-4">
              {renderForm()}
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="shrink-0 flex-row gap-2 border-t pt-4">
          {activeThesis && (
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
          <Button onClick={handleApply} className="flex-1">
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
