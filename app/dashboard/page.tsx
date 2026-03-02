import React from "react"
import { Database, Search, AlertTriangle, Shield, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Threat Database</h1>
        <p className="mt-2 text-muted-foreground">
          Search and explore the ThreadMoat threat intelligence database.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search threats, IPs, domains, hashes..."
            className="pl-10"
          />
        </div>
        <Button>Search</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<Database className="h-5 w-5" />}
          title="Total Threats"
          value="2,847,392"
          description="Tracked indicators"
        />
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Active Threats"
          value="12,847"
          description="Last 24 hours"
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          title="Trending"
          value="+847"
          description="New today"
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          title="Last Updated"
          value="2 min ago"
          description="Real-time sync"
        />
      </div>

      {/* Recent Threats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Threats</CardTitle>
          <CardDescription>Latest threat indicators added to the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Indicator</th>
                  <th className="p-3 text-left font-medium">Type</th>
                  <th className="p-3 text-left font-medium">Severity</th>
                  <th className="p-3 text-left font-medium">Source</th>
                  <th className="p-3 text-left font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {mockThreats.map((threat, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">{threat.indicator}</td>
                    <td className="p-3">
                      <span className="rounded bg-muted px-2 py-1 text-xs">
                        {threat.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <SeverityBadge severity={threat.severity} />
                    </td>
                    <td className="p-3 text-muted-foreground">{threat.source}</td>
                    <td className="p-3 text-muted-foreground">{threat.added}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode
  title: string
  value: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function SeverityBadge({ severity }: { severity: "critical" | "high" | "medium" | "low" }) {
  const colors = {
    critical: "bg-red-500/10 text-red-500",
    high: "bg-orange-500/10 text-orange-500",
    medium: "bg-yellow-500/10 text-yellow-500",
    low: "bg-green-500/10 text-green-500",
  }
  
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${colors[severity]}`}>
      {severity}
    </span>
  )
}

const mockThreats = [
  { indicator: "192.168.1.100", type: "IP", severity: "critical" as const, source: "Honeypot", added: "2 min ago" },
  { indicator: "malware.example.com", type: "Domain", severity: "high" as const, source: "OSINT", added: "5 min ago" },
  { indicator: "a3f2c8d9e1b4...", type: "Hash", severity: "medium" as const, source: "Sandbox", added: "12 min ago" },
  { indicator: "10.0.0.55", type: "IP", severity: "high" as const, source: "IDS", added: "18 min ago" },
  { indicator: "phishing.test.net", type: "Domain", severity: "critical" as const, source: "Report", added: "25 min ago" },
]
