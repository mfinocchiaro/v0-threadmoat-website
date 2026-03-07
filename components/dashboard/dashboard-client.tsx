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
import { Rocket, TrendingUp, Building2, Layers, Focus } from "lucide-react"
import { FOCUS_SCENARIOS } from "@/components/dashboard/sidebar"

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

function DashboardInner({ companies, isLoading, profileType, onSelectProfile }: {
  companies: Company[]
  isLoading: boolean
  profileType?: string
  onSelectProfile: (p: string) => void
}) {
  const [thesisPanelOpen, setThesisPanelOpen] = useState(false)

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
        <Button variant="outline" size="sm" onClick={() => setThesisPanelOpen(true)}>
          <Focus className="mr-2 h-4 w-4" />
          {config?.buttonText ?? "Configure Filters"}
        </Button>
      </div>

      <ThesisResults companies={companies} />

      {profileType === "startup_founder" && <StartupDashboard data={companies} isLoading={isLoading} />}
      {profileType === "vc_investor" && <VCDashboard data={companies} isLoading={isLoading} />}
      {profileType === "oem_enterprise" && <OEMDashboard data={companies} isLoading={isLoading} />}
      {profileType === "isv_platform" && <ISVDashboard data={companies} isLoading={isLoading} />}

      <ThesisPanel
        open={thesisPanelOpen}
        onOpenChange={setThesisPanelOpen}
        companies={companies}
        profileType={profileType}
        isAdmin={false}
      />
    </>
  )
}

export function DashboardClient({ profileType: _unused, isAdmin: _unusedAdmin }: { profileType?: string; isAdmin?: boolean }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { scenario, setScenario } = useScenario()

  useEffect(() => {
    loadCompanyData().then(data => { setCompanies(data); setIsLoading(false) })
  }, [])

  return (
    <FilterProvider>
      <ThesisProvider profileType={scenario}>
        <DashboardInner
          companies={companies}
          isLoading={isLoading}
          profileType={scenario}
          onSelectProfile={setScenario}
        />
      </ThesisProvider>
    </FilterProvider>
  )
}
