'use client'

import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  LogOut, Settings, ChevronDown,
  GitBranch, Circle, Network, Sun, BarChart2, LayoutGrid, Table2, Map, GitCompare,
  Layers, Workflow, Radar, Grid, Clock, Sliders, BoxSelect, TrendingUp, Activity,
  Cloud, Disc, ScatterChart, LayoutTemplate, Orbit, Users, Grid3x3, FileBarChart, Eye,
  Compass,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Session } from 'next-auth'

const VIZ_LINKS = [
  { href: '/dashboard/landscape-intro', icon: Compass,   label: 'Investment Landscape' },
  { href: '/dashboard/quadrant',       icon: GitBranch,  label: 'Magic Quadrant' },
  { href: '/dashboard/bubbles',        icon: Circle,     label: 'Bubble Chart' },
  { href: '/dashboard/network',        icon: Network,    label: 'Network Graph' },
  { href: '/dashboard/sunburst',       icon: Sun,        label: 'Sunburst' },
  { href: '/dashboard/bar-chart',      icon: BarChart2,  label: 'Bar Chart' },
  { href: '/dashboard/landscape',      icon: LayoutGrid, label: 'Landscape' },
  { href: '/dashboard/periodic-table', icon: Table2,     label: 'Periodic Table' },
  { href: '/dashboard/map',            icon: Map,        label: 'Geography Map' },
  { href: '/dashboard/treemap',        icon: Layers,     label: 'Treemap' },
  { href: '/dashboard/sankey',         icon: Workflow,   label: 'Flow Diagram' },
  { href: '/dashboard/radar',          icon: Radar,      label: 'Radar Chart' },
  { href: '/dashboard/heatmap',        icon: Grid,       label: 'Heatmap' },
  { href: '/dashboard/timeline',       icon: Clock,      label: 'Timeline' },
  { href: '/dashboard/parallel',       icon: Sliders,    label: 'Parallel Coords' },
  { href: '/dashboard/box-plot',       icon: BoxSelect,  label: 'Box Plot' },
  { href: '/dashboard/distribution',   icon: Activity,   label: 'Distribution' },
  { href: '/dashboard/slope',          icon: TrendingUp,      label: 'Slope Chart' },
  { href: '/dashboard/wordcloud',      icon: Cloud,           label: 'Word Cloud' },
  { href: '/dashboard/chord',          icon: Disc,            label: 'Chord Diagram' },
  { href: '/dashboard/splom',          icon: ScatterChart,    label: 'Scatter Matrix' },
  { href: '/dashboard/marimekko',      icon: LayoutTemplate,  label: 'Marimekko' },
  { href: '/dashboard/spiral',         icon: Orbit,           label: 'Spiral Timeline' },
  { href: '/dashboard/investor-stats', icon: Users,           label: 'Investor Stats' },
  { href: '/dashboard/financial-heatmap', icon: Grid3x3,       label: 'Financial Heatmap' },
  { href: '/dashboard/correlation',    icon: Grid3x3,         label: 'Correlation' },
  { href: '/dashboard/reports',        icon: FileBarChart,    label: 'Reports' },
  { href: '/dashboard/investor-views', icon: Eye,             label: 'Investor Views' },
]

const PROFILE_LABELS: Record<string, string> = {
  startup_founder: 'Competitive Moat Swimmer',
  vc_investor: 'Investment Thesis Writer',
  oem_enterprise: 'White Space Filler',
  isv_platform: 'Targeted Acquisition Radar',
}

interface Profile { full_name?: string; company?: string; title?: string; profile_type?: string }

export function DashboardNav({ user, profile }: { user: Session['user']; profile?: Profile }) {
  const pathname = usePathname()
  const isVizActive = VIZ_LINKS.some(l => pathname.startsWith(l.href))

  async function handleSignOut() { await signOut({ callbackUrl: '/' }) }

  const profileLabel = profile?.profile_type ? PROFILE_LABELS[profile.profile_type] : null
  const initials = profile?.full_name
    ? profile.full_name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
    : user?.email?.[0].toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="ThreadMoat" width={160} height={42} className="h-10 w-auto" unoptimized />
        </Link>

        <nav className="flex items-center gap-5">
          <Link href="/dashboard" className={cn("text-sm transition-colors", pathname === '/dashboard' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
            Dashboard
          </Link>

          {/* Visualizations dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex items-center gap-1 text-sm transition-colors", isVizActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
                Visualizations <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {VIZ_LINKS.map(({ href, icon: Icon, label }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} className={cn("flex items-center gap-2 cursor-pointer", pathname.startsWith(href) && "font-medium text-primary")}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/dashboard/compare" className={cn("flex items-center gap-1 text-sm transition-colors", pathname.startsWith('/dashboard/compare') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
            <GitCompare className="h-4 w-4" /> Compare
          </Link>
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {initials}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              {profile?.full_name && <p className="text-sm font-medium">{profile.full_name}</p>}
              {(profile?.company || profile?.title) && (
                <p className="text-xs text-muted-foreground">{[profile.title, profile.company].filter(Boolean).join(' · ')}</p>
              )}
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              {profileLabel && (
                <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{profileLabel}</span>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-500">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
