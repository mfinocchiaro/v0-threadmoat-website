"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider } from "@/contexts/filter-context"
import { ThesisProvider, PROFILE_THESIS_CONFIG, ADMIN_THESIS_CONFIG } from "@/contexts/thesis-context"
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

const PROFILES = [
  { key: "startup_founder", label: "Founder / Startup", icon: <Rocket className="size-6" />, desc: "Track competitors, monitor funding rounds, find partnership opportunities." },
  { key: "vc_investor",     label: "VC / Investor",     icon: <TrendingUp className="size-6" />, desc: "Discover deal flow, track portfolio companies, monitor market trends." },
  { key: "oem_enterprise",  label: "OEM / Enterprise",  icon: <Building2 className="size-6" />, desc: "Identify integration partners, track technology adoption, detect threats." },
  { key: "isv_platform",    label: "ISV / Platform",    icon: <Layers className="size-6" />,     desc: "Explore ecosystem partners, track API adoption, map integrations." },
]

function ProfilePicker({ onSelect }: { onSelect: (profile: string) => void }) {
  return (
    <div className="space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome to ThreadMoat</h1>
        <p className="text-muted-foreground mt-2">Select your profile to see your personalized dashboard.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
        {PROFILES.map(p => (
          <button key={p.key} onClick={() => onSelect(p.key)} className="text-left">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="rounded-md bg-primary/10 p-2 text-primary w-fit mb-2">{p.icon}</div>
                <CardTitle className="text-base">{p.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Save your preference permanently in <Link href="/dashboard/settings" className="underline underline-offset-2 hover:text-foreground">Settings</Link>.
      </p>
    </div>
  )
}

function DashboardInner({ companies, isLoading, profileType, isAdmin, onSelectProfile }: {
  companies: Company[]
  isLoading: boolean
  profileType?: string
  isAdmin?: boolean
  onSelectProfile: (p: string) => void
}) {
  const [thesisPanelOpen, setThesisPanelOpen] = useState(false)

  if (!profileType) {
    return <ProfilePicker onSelect={onSelectProfile} />
  }

  const config = isAdmin
    ? ADMIN_THESIS_CONFIG
    : (profileType ? PROFILE_THESIS_CONFIG[profileType] : undefined) ?? ADMIN_THESIS_CONFIG

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {PROFILES.find(p => p.key === profileType)?.label} Dashboard
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setThesisPanelOpen(true)}>
          <Focus className="mr-2 h-4 w-4" />
          {config.buttonText}
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
        isAdmin={isAdmin}
      />
    </>
  )
}

export function DashboardClient({ profileType: initialProfileType, isAdmin }: { profileType?: string; isAdmin?: boolean }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [profileType, setProfileType] = useState(initialProfileType)

  useEffect(() => {
    loadCompanyData().then(data => { setCompanies(data); setIsLoading(false) })
  }, [])

  return (
    <FilterProvider>
      <ThesisProvider profileType={profileType}>
        <DashboardInner
          companies={companies}
          isLoading={isLoading}
          profileType={profileType}
          isAdmin={isAdmin}
          onSelectProfile={setProfileType}
        />
      </ThesisProvider>
    </FilterProvider>
  )
}
