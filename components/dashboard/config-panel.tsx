"use client"

import { useState, useEffect, useTransition, useCallback, startTransition as reactStartTransition } from "react"
import { Company } from "@/lib/company-data"
import {
  useThesis, ThesisType, VCThesis, ISVThesis, OEMThesis,
  PROFILE_THESIS_CONFIG, ProfileThesisConfig,
} from "@/contexts/thesis-context"
import { useLayout } from "@/contexts/layout-context"
import { getAvailableWidgets } from "@/lib/widget-registry"
import { VCStep } from "@/components/dashboard/thesis-steps/vc-step"
import { ISVStep } from "@/components/dashboard/thesis-steps/isv-step"
import { OEMStep } from "@/components/dashboard/thesis-steps/oem-step"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Settings2, Focus, X, ChevronLeft, Save, Trash2, BookOpen,
  RotateCcw, Shield, Check, Loader2, Rocket, TrendingUp, Building2, Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FOCUS_SCENARIOS } from "@/components/dashboard/sidebar"

interface SavedThesisEntry {
  id: string
  name: string
  scenario: string
  thesis: {
    activeThesis: string | null
    vc: VCThesis
    isv: ISVThesis
    oem: OEMThesis
  }
  createdAt: string
}

interface ConfigPanelProps {
  companies: Company[]
  profileType?: string
  isAdmin: boolean
  onSelectScenario?: (key: string) => void
}

function profileToThesisType(profileType?: string): ThesisType {
  const config = profileType ? PROFILE_THESIS_CONFIG[profileType] : undefined
  return config?.thesisType ?? "vc"
}

function getConfig(profileType?: string): ProfileThesisConfig {
  if (profileType && PROFILE_THESIS_CONFIG[profileType]) return PROFILE_THESIS_CONFIG[profileType]
  return PROFILE_THESIS_CONFIG["vc_investor"]
}

export function ConfigPanel({ companies, profileType, isAdmin, onSelectScenario }: ConfigPanelProps) {
  const [open, setOpen] = useState(false)
  const {
    vcThesis, isvThesis, oemThesis,
    applyThesis, clearThesis, activeThesis, activeConfig,
    setVCThesis, setISVThesis, setOEMThesis,
  } = useThesis()

  const { getEnabledWidgets, toggleWidget, resetLayout } = useLayout()

  const config = getConfig(profileType)
  const defaultType = profileToThesisType(profileType)
  const scenario = profileType ?? "vc_investor"

  // Draft state for thesis form
  const [draftVC, setDraftVC] = useState<VCThesis>(vcThesis)
  const [draftISV, setDraftISV] = useState<ISVThesis>(isvThesis)
  const [draftOEM, setDraftOEM] = useState<OEMThesis>(oemThesis)

  // Saved theses state
  const [savedTheses, setSavedTheses] = useState<SavedThesisEntry[]>([])
  const [saveName, setSaveName] = useState("")
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [savedThesesLoaded, setSavedThesesLoaded] = useState(false)

  // Load saved theses
  useEffect(() => {
    if (savedThesesLoaded) return
    fetch("/api/profile/saved-theses")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.saved_theses) setSavedTheses(data.saved_theses)
        setSavedThesesLoaded(true)
      })
      .catch(() => setSavedThesesLoaded(true))
  }, [savedThesesLoaded])

  // Sync drafts when thesis changes or panel opens
  useEffect(() => {
    if (open) {
      setDraftVC(vcThesis)
      setDraftISV(isvThesis)
      setDraftOEM(oemThesis)
    }
  }, [open, vcThesis, isvThesis, oemThesis])

  const [isPending, startTransition] = useTransition()

  function handleApply() {
    startTransition(() => {
      applyThesis(defaultType, { vc: draftVC, isv: draftISV, oem: draftOEM })
    })
  }

  function handleClear() {
    clearThesis()
  }

  // Save current thesis config
  const handleSave = useCallback(async () => {
    if (!saveName.trim()) return
    const thesisData = {
      activeThesis: defaultType,
      vc: draftVC,
      isv: draftISV,
      oem: draftOEM,
    }
    try {
      const res = await fetch("/api/profile/saved-theses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName.trim(), scenario, thesis: thesisData }),
      })
      if (res.ok) {
        const { entry } = await res.json()
        setSavedTheses(prev => [...prev, entry])
        setSaveName("")
        setShowSaveInput(false)
      }
    } catch { /* silent */ }
  }, [saveName, draftVC, draftISV, draftOEM, defaultType, scenario])

  // Load a saved thesis
  function handleRecall(entry: SavedThesisEntry) {
    const t = entry.thesis
    if (t.vc) { setDraftVC(t.vc); setVCThesis(t.vc) }
    if (t.isv) { setDraftISV(t.isv); setISVThesis(t.isv) }
    if (t.oem) { setDraftOEM(t.oem); setOEMThesis(t.oem) }
    startTransition(() => {
      applyThesis(
        (t.activeThesis as ThesisType) ?? defaultType,
        { vc: t.vc, isv: t.isv, oem: t.oem },
      )
    })
  }

  // Delete a saved thesis
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/profile/saved-theses?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setSavedTheses(prev => prev.filter(e => e.id !== id))
      }
    } catch { /* silent */ }
  }

  // Widget layout state
  const enabled = getEnabledWidgets(scenario)
  const available = getAvailableWidgets(scenario, isAdmin)
  const standardWidgets = available.filter(w => !w.adminOnly)
  const adminWidgets = available.filter(w => w.adminOnly)

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

  // Filter saved theses to current scenario
  const scenarioSaved = savedTheses.filter(s => s.scenario === scenario)

  return (
    <>
      {/* Semi-circle tab — always visible on right edge */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-40",
          "w-6 h-24 rounded-l-full",
          "bg-primary text-primary-foreground shadow-lg",
          "flex items-center justify-center",
          "hover:w-8 transition-all duration-200",
          "group",
          open && "hidden",
        )}
        aria-label="Open configuration panel"
      >
        <ChevronLeft className="size-4 group-hover:size-5 transition-all" />
      </button>

      {/* Slide-out overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[420px] max-w-[90vw]",
          "bg-background border-l shadow-2xl",
          "flex flex-col",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Focus className="size-4 text-primary shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">
                {activeConfig?.indicatorLabel ?? config.sheetTitle}
              </h2>
              {activeThesis && (
                <p className="text-[10px] text-emerald-500 font-medium">Active</p>
              )}
              {!activeThesis && (
                <p className="text-[10px] text-muted-foreground">No filter active</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scenario switcher */}
        {onSelectScenario && (
          <div className="px-4 pt-3 shrink-0">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Research Focus
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {FOCUS_SCENARIOS.map(s => {
                const Icon = s.icon
                const isActive = profileType === s.key
                return (
                  <button
                    key={s.key}
                    onClick={() => onSelectScenario(s.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors text-xs",
                      isActive
                        ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{s.shortLabel}</span>
                  </button>
                )
              })}
            </div>
            <Separator className="mt-3" />
          </div>
        )}

        {/* Tabs for Thesis / Layout */}
        <Tabs defaultValue="thesis" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-3 shrink-0">
            <TabsList className="w-full">
              <TabsTrigger value="thesis" className="flex-1 gap-1.5">
                <Focus className="size-3.5" />
                {config.tabLabel} Thesis
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex-1 gap-1.5">
                <Settings2 className="size-3.5" />
                Layout
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ─── Thesis Tab ──────────────────────────── */}
          <TabsContent value="thesis" className="flex-1 flex flex-col min-h-0 mt-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 py-3 space-y-4">
                {/* Saved theses section */}
                {scenarioSaved.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="size-3" />
                      Saved Configurations
                    </h3>
                    <div className="space-y-1">
                      {scenarioSaved.map(entry => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted group"
                        >
                          <button
                            onClick={() => handleRecall(entry)}
                            className="flex-1 text-left truncate text-foreground hover:text-primary transition-colors"
                          >
                            {entry.name}
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                )}

                {/* Thesis config form */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {config.sheetTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {config.sheetDescription}
                  </p>
                  {renderForm()}
                </div>
              </div>
            </ScrollArea>

            {/* Thesis footer actions */}
            <div className="shrink-0 border-t px-4 py-3 space-y-2">
              {/* Save thesis row */}
              {showSaveInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder='e.g. "CFD platform search"'
                    className="h-8 text-sm flex-1"
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={handleSave} disabled={!saveName.trim()}>
                    <Check className="size-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowSaveInput(false); setSaveName("") }}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => setShowSaveInput(true)}
                >
                  <Save className="mr-2 size-3.5" />
                  Save as named thesis
                </Button>
              )}

              {/* Apply / Clear buttons */}
              <div className="flex gap-2">
                {activeThesis && (
                  <Button variant="outline" size="sm" onClick={handleClear}>
                    Clear
                  </Button>
                )}
                <Button size="sm" onClick={handleApply} className="flex-1" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                  Apply
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ─── Layout Tab ──────────────────────────── */}
          <TabsContent value="layout" className="flex-1 flex flex-col min-h-0 mt-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 py-3 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Charts
                  </h3>
                  <div className="space-y-3">
                    {standardWidgets.map(w => (
                      <label key={w.id} className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm">{w.label}</span>
                        <Switch
                          checked={enabled.includes(w.id)}
                          onCheckedChange={() => reactStartTransition(() => toggleWidget(scenario, w.id))}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {adminWidgets.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Shield className="size-3.5" />
                      Advanced Analytics
                    </h3>
                    <div className="space-y-3">
                      {adminWidgets.map(w => (
                        <label key={w.id} className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm">{w.label}</span>
                          <Switch
                            checked={enabled.includes(w.id)}
                            onCheckedChange={() => reactStartTransition(() => toggleWidget(scenario, w.id))}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => resetLayout(scenario)}
                >
                  <RotateCcw className="mr-2 size-3.5" />
                  Reset to Defaults
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
