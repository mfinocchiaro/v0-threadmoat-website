import React from "react"
import { Database, TrendingUp, Clock, Users, Building2, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Thread Database</h1>
        <p className="mt-2 text-muted-foreground">
          Search and explore the ThreadMoat Industrial AI &amp; Engineering Software database.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search startups, companies, technologies..."
            className="pl-10"
          />
        </div>
        <Button>Search</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<Database className="h-5 w-5" />}
          title="Total Startups"
          value="500+"
          description="Tracked companies"
        />
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          title="Founders"
          value="100+"
          description="Warm introductions available"
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          title="VC Funding"
          value="$13.2B+"
          description="Total investment tracked"
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          title="Last Updated"
          value="Today"
          description="Real-time sync"
        />
      </div>

      {/* Recent Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Database Entries</CardTitle>
          <CardDescription>Latest startups and companies added to the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Company</th>
                  <th className="p-3 text-left font-medium">Category</th>
                  <th className="p-3 text-left font-medium">Stage</th>
                  <th className="p-3 text-left font-medium">Funding</th>
                  <th className="p-3 text-left font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {mockCompanies.map((company, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{company.name}</td>
                    <td className="p-3 text-muted-foreground">{company.category}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {company.stage}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{company.funding}</td>
                    <td className="p-3 text-muted-foreground">{company.added}</td>
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
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const mockCompanies = [
  { name: "Aras Corporation", category: "PLM", stage: "Growth", funding: "$40M", added: "Today" },
  { name: "Physna", category: "CAD AI", stage: "Series B", funding: "$56M", added: "Today" },
  { name: "Symbio Robotics", category: "Manufacturing AI", stage: "Series B", funding: "$63M", added: "Yesterday" },
  { name: "Vention", category: "Automation", stage: "Series C", funding: "$95M", added: "Yesterday" },
  { name: "Hadrian", category: "Precision Machining", stage: "Series B", funding: "$117M", added: "2 days ago" },
]
