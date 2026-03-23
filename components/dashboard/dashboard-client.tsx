"use client"

import { useEffect, useState, startTransition, useCallback, useMemo } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider } from "@/contexts/filter-context"
import { ThesisProvider, ThesisType, useThesis } from "@/contexts/thesis-context"
import { useScenario } from "@/contexts/scenario-context"
import { StartupDashboard } from "@/components/dashboards/startup-dashboard"
import { VCDashboard } from "@/components/dashboards/vc-dashboard"
import { OEMDashboard } from "@/components/dashboards/oem-dashboard"
import { ISVDashboard } from "@/components/dashboards/isv-dashboard"
import { ThesisResults } from "@/components/dashboard/thesis-results"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket, TrendingUp, Building2, Layers } from "lucide-react"
import { FOCUS_SCENARIOS } from "@/components/dashboard/sidebar"
import { LayoutProvider } from "@/contexts/layout-context"
import { ConfigPanel } from "@/components/dashboard/config-panel"
import { usePlan } from "@/contexts/plan-context"
import { maskCompanies } from "@/lib/name-masking"

const SCENARIO_THESIS: Record<string, ThesisType> = {
  startup_founder: "founder",
  vc_investor: "vc",
  isv_platform: "isv",
  oem_enterprise: "oem",
}

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
            <button key={s.key} onClick={() => startTransition(() => onSelect(s.key))} className="text-left">
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
  const { applyThesis } = useThesis()
  const { isFreeUser, accessTier } = usePlan()

  // Mask company names for Analyst tier (Strategist + Admin see real names)
  const maskedCompanies = useMemo(() => maskCompanies(companies, accessTier), [companies, accessTier])

  const handleSelectProfile = useCallback((key: string) => {
    onSelectProfile(key)
    const thesisType = SCENARIO_THESIS[key] ?? "vc"
    applyThesis(thesisType)
  }, [onSelectProfile, applyThesis])

  if (!profileType) {
    return <ScenarioPicker onSelect={handleSelectProfile} />
  }

  const scenarioData = FOCUS_SCENARIOS.find(s => s.key === profileType)

  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          {scenarioData?.label ?? "Dashboard"}
        </h2>
      </div>

      <ThesisResults companies={maskedCompanies} />

      {profileType === "startup_founder" && <StartupDashboard data={maskedCompanies} isLoading={isLoading} isAdmin={isAdmin} />}
      {profileType === "vc_investor" && <VCDashboard data={maskedCompanies} isLoading={isLoading} isAdmin={isAdmin} />}
      {profileType === "oem_enterprise" && <OEMDashboard data={maskedCompanies} isLoading={isLoading} isAdmin={isAdmin} />}
      {profileType === "isv_platform" && <ISVDashboard data={maskedCompanies} isLoading={isLoading} isAdmin={isAdmin} />}

      <ConfigPanel
        companies={companies}
        profileType={profileType}
        isAdmin={isAdmin}
        onSelectScenario={handleSelectProfile}
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
      <LayoutProvider isAdmin={isAdmin}>
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
