"use client"

import { useState, useEffect, useTransition } from "react"
import { Company } from "@/lib/company-data"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  useThesis, ThesisType, VCThesis, ISVThesis, OEMThesis,
  PROFILE_THESIS_CONFIG, ADMIN_THESIS_CONFIG, ProfileThesisConfig,
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

function getConfig(profileType?: string, isAdmin?: boolean): ProfileThesisConfig {
  if (isAdmin) return ADMIN_THESIS_CONFIG
  if (profileType && PROFILE_THESIS_CONFIG[profileType]) return PROFILE_THESIS_CONFIG[profileType]
  return ADMIN_THESIS_CONFIG
}

export function ThesisPanel({ open, onOpenChange, companies, profileType, isAdmin }: ThesisPanelProps) {
  const {
    vcThesis, isvThesis, oemThesis,
    applyThesis, clearThesis, activeThesis,
  } = useThesis()

  const config = getConfig(profileType, isAdmin)
  const singleTab = !isAdmin
  const defaultType = profileToThesisType(profileType)

  const [tab, setTab] = useState<ThesisType>(defaultType)

  // Draft state
  const [draftVC, setDraftVC] = useState<VCThesis>(vcThesis)
  const [draftISV, setDraftISV] = useState<ISVThesis>(isvThesis)
  const [draftOEM, setDraftOEM] = useState<OEMThesis>(oemThesis)

  useEffect(() => {
    if (open) {
      setDraftVC(vcThesis)
      setDraftISV(isvThesis)
      setDraftOEM(oemThesis)
      setTab(defaultType)
    }
  }, [open, vcThesis, isvThesis, oemThesis, defaultType])

  const [isPending, startTransition] = useTransition()

  function handleApply() {
    onOpenChange(false)
    startTransition(() => {
      applyThesis(tab, { vc: draftVC, isv: draftISV, oem: draftOEM })
    })
  }

  function handleClear() {
    clearThesis()
    onOpenChange(false)
  }

  const vcVariant = (tab === "founder" || defaultType === "founder") ? "founder" : "investor"

  // Form content for a given thesis type
  function renderForm(type: ThesisType) {
    switch (type) {
      case "founder":
      case "vc":
        return <VCStep thesis={draftVC} onChange={setDraftVC} companies={companies} variant={type === "founder" ? "founder" : "investor"} />
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

        {singleTab ? (
          // Single profile — no tab bar, just the form
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="px-1 pb-4">
                {renderForm(defaultType)}
              </div>
            </ScrollArea>
          </div>
        ) : (
          // Admin — all tabs
          <Tabs value={tab} onValueChange={(v) => setTab(v as ThesisType)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="founder" className="flex-1">Founder</TabsTrigger>
              <TabsTrigger value="vc" className="flex-1">Investor</TabsTrigger>
              <TabsTrigger value="isv" className="flex-1">ISV</TabsTrigger>
              <TabsTrigger value="oem" className="flex-1">OEM</TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-full">
                <div className="px-1 pb-4">
                  <TabsContent value="founder" className="mt-0">
                    <VCStep thesis={draftVC} onChange={setDraftVC} companies={companies} variant="founder" />
                  </TabsContent>
                  <TabsContent value="vc" className="mt-0">
                    <VCStep thesis={draftVC} onChange={setDraftVC} companies={companies} variant="investor" />
                  </TabsContent>
                  <TabsContent value="isv" className="mt-0">
                    <ISVStep thesis={draftISV} onChange={setDraftISV} companies={companies} />
                  </TabsContent>
                  <TabsContent value="oem" className="mt-0">
                    <OEMStep thesis={draftOEM} onChange={setDraftOEM} companies={companies} />
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        )}

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
