"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider } from "@/contexts/filter-context"
import { ThesisProvider, PROFILE_THESIS_CONFIG } from "@/contexts/thesis-context"
import { useScenario } from "@/contexts/scenario-context"
import { StartupDashboard } from "@/components/dashboards/startup-dashboard"
import { VCDashboard } from "@/components/dashboards/vc-dashboard"
import { OEMDashboard } from "@/components/dashboards/oem-dashboard"
import { ISVDashboard } from "@/components/dashboards/isv-dashboard"
import { ThesisPanel } from "@/components/dashboard/thesis-panel"
import { ThesisResults } from "@/components/dashboard/thesis-results"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Rocket, TrendingUp, Building2, Layers, Focus, Settings2 } from "lucide-react"
import { FOCUS_SCENARIOS } from "@/components/dashboard/sidebar"
import { LayoutProvider } from "@/contexts/layout-context"
import { WidgetPicker } from "@/components/dashboard/widget-picker"

function ScenarioPicker({ onSelect }: { onSelect: (key: string) => void }) {
  return (
    <div className="space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome to ThreadMoat</h1>
        <p className="text-muted-foreground mt-2">Select your focus scenario to see your personalized dashboard.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
        {FOCUS_SCENARIOS.map(s => {
          const Icon = s.icon
          return (
            <button key={s.key} onClick={() => onSelect(s.key)} className="text-left">
              <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="rounded-md bg-primary/10 p-2 text-primary w-fit mb-2"><Icon className="size-6" /></div>
                  <CardTitle className="text-base">{s.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        You can switch focus any time from the left sidebar menu.
      </p>
    </div>
  )
}

function DashboardInner({ companies, isLoading, profileType, onSelectProfile, isAdmin }: {
  companies: Company[]
  isLoading: boolean
  profileType?: string
  onSelectProfile: (p: string) => void
  isAdmin: boolean
}) {
  const [thesisPanelOpen, setThesisPanelOpen] = useState(false)
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false)

  if (!profileType) {
    return <ScenarioPicker onSelect={onSelectProfile} />
  }

  const config = profileType ? PROFILE_THESIS_CONFIG[profileType] : undefined

  const scenarioData = FOCUS_SCENARIOS.find(s => s.key === profileType)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {scenarioData?.label ?? "Dashboard"}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWidgetPickerOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Customize
          </Button>
          <Button variant="outline" size="sm" onClick={() => setThesisPanelOpen(true)}>
            <Focus className="mr-2 h-4 w-4" />
            {config?.buttonText ?? "Configure Filters"}
          </Button>
        </div>
      </div>

      <ThesisResults companies={companies} />

      {profileType === "startup_founder" && <StartupDashboard data={companies} isLoading={isLoading} isAdmin={isAdmin} />}
      {profileType === "vc_investor" && <VCDashboard data={companies} isLoading={isLoading} isAdmin={isAdmin} />}
      {profileType === "oem_enterprise" && <OEMDashboard data={companies} isLoading={isLoading} isAdmin={isAdmin} />}
      {profileType === "isv_platform" && <ISVDashboard data={companies} isLoading={isLoading} isAdmin={isAdmin} />}

      <ThesisPanel
        open={thesisPanelOpen}
        onOpenChange={setThesisPanelOpen}
        companies={companies}
        profileType={profileType}
        isAdmin={false}
      />

      <WidgetPicker
        open={widgetPickerOpen}
        onOpenChange={setWidgetPickerOpen}
        scenario={profileType}
        isAdmin={isAdmin}
      />
    </>
  )
}

export function DashboardClient({ isAdmin = false }: { profileType?: string; isAdmin?: boolean }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { scenario, setScenario } = useScenario()

  useEffect(() => {
    loadCompanyData().then(data => { setCompanies(data); setIsLoading(false) })
  }, [])

  return (
    <FilterProvider>
      <LayoutProvider>
        <ThesisProvider profileType={scenario}>
          <DashboardInner
            companies={companies}
            isLoading={isLoading}
            profileType={scenario}
            onSelectProfile={setScenario}
            isAdmin={isAdmin}
          />
        </ThesisProvider>
      </LayoutProvider>
    </FilterProvider>
  )
}
