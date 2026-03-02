"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Settings, BarChart2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

type User = {
  id: string
  email: string
  profile_type: string
  company_name: string | null
  title: string | null
  is_admin: boolean
}

const PROFILE_LABELS: Record<string, string> = {
  startup_founder: 'Startup / Founder',
  vc_pe_investor: 'VC / PE / Investor',
  oem_enterprise: 'OEM / Enterprise',
  isv_platform: 'ISV / Platform',
}

export function DashboardNav({ user }: { user: User }) {
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push("/")
    router.refresh()
  }

  const profileLabel = PROFILE_LABELS[user.profile_type] || user.profile_type

  return (
    <header className="border-b border-border/40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">ThreadMoat</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Database
          </Link>
          <a
            href="https://dashboard-theta-pearl-67.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <BarChart2 className="h-4 w-4" />
            Analytics
          </a>
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden md:inline-flex">
            {profileLabel}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {user.email?.[0].toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{user.email}</p>
                  {user.company_name && (
                    <p className="text-xs text-muted-foreground">
                      {user.title && `${user.title} at `}{user.company_name}
                    </p>
                  )}
                  <Badge variant="outline" className="w-fit mt-1 text-xs">
                    {profileLabel}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
