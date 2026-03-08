"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ChevronLeft, ChevronRight, GitBranch, Circle,
  Network, Sun, BarChart2, LayoutGrid, Table2, Map, GitCompare,
  Settings, TrendingUp, TreePine, Wind, Radar, Flame, Clock,
  SlidersHorizontal, BoxSelect, Activity, MoveRight, Type,
  Link2, ScatterChart, BarChart3, RefreshCw, Users, GridIcon, FileText, Eye,
  Compass, Focus, Rocket, Building2, Layers, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useThesisOptional } from "@/contexts/thesis-context";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/explore", icon: Eye, label: "Free Explorer", exact: true },
];

export const FOCUS_SCENARIOS = [
  {
    key: "startup_founder",
    label: "Competitive Moat Swimmer",
    shortLabel: "Moat Swimmer",
    icon: Rocket,
    desc: "Track competitors, monitor funding rounds, find positioning gaps.",
  },
  {
    key: "vc_investor",
    label: "Investment Thesis Writer",
    shortLabel: "Thesis Writer",
    icon: TrendingUp,
    desc: "Discover deal flow, track portfolios, monitor market trends.",
  },
  {
    key: "oem_enterprise",
    label: "White Space Filler",
    shortLabel: "White Space",
    icon: Building2,
    desc: "Map software landscape, identify gaps and replacement targets.",
  },
  {
    key: "isv_platform",
    label: "Targeted Acquisition Radar",
    shortLabel: "Acq. Radar",
    icon: Layers,
    desc: "Find acquisition targets, partnership and integration opportunities.",
  },
];

const VIZ_ITEMS = [
  { href: "/dashboard/landscape-intro", icon: Compass,          label: "Investment Landscape" },
  { href: "/dashboard/quadrant",       icon: GitBranch,        label: "Magic Quadrant" },
  { href: "/dashboard/bubbles",        icon: Circle,           label: "Bubble Chart" },
  { href: "/dashboard/network",        icon: Network,          label: "Network Graph" },
  { href: "/dashboard/sunburst",       icon: Sun,              label: "Sunburst" },
  { href: "/dashboard/bar-chart",      icon: BarChart2,        label: "Bar Chart" },
  { href: "/dashboard/landscape",      icon: LayoutGrid,       label: "Landscape" },
  { href: "/dashboard/periodic-table", icon: Table2,           label: "Periodic Table" },
  { href: "/dashboard/map",            icon: Map,              label: "Geography Map" },
  { href: "/dashboard/compare",        icon: GitCompare,       label: "Compare" },
  { href: "/dashboard/treemap",        icon: TreePine,         label: "Treemap" },
  { href: "/dashboard/sankey",         icon: Wind,             label: "Sankey Flow" },
  { href: "/dashboard/radar",          icon: Radar,            label: "Radar Chart" },
  { href: "/dashboard/heatmap",        icon: Flame,            label: "Heatmap" },
  { href: "/dashboard/timeline",       icon: Clock,            label: "Timeline" },
  { href: "/dashboard/parallel",       icon: SlidersHorizontal, label: "Parallel Coords" },
  { href: "/dashboard/box-plot",       icon: BoxSelect,        label: "Box Plot" },
  { href: "/dashboard/distribution",   icon: Activity,         label: "Distribution" },
  { href: "/dashboard/wordcloud",      icon: Type,             label: "Word Cloud" },
  { href: "/dashboard/chord",          icon: Link2,            label: "Chord Diagram" },
  { href: "/dashboard/marimekko",      icon: BarChart3,        label: "Marimekko" },
  { href: "/dashboard/spiral",         icon: TrendingUp,       label: "Spiral Timeline" },
  { href: "/dashboard/patterns",       icon: GridIcon,         label: "Patterns" },
];

const ADMIN_ITEMS = [
  { href: "/dashboard/investor-stats",    icon: Users,     label: "Investor Stats" },
  { href: "/dashboard/financial-heatmap", icon: Flame,     label: "Financial Heatmap" },
  { href: "/dashboard/correlation",       icon: GridIcon,  label: "Correlation Matrix" },
  { href: "/dashboard/reports",           icon: FileText,  label: "Report Generator" },
  { href: "/dashboard/investor-views",    icon: Eye,       label: "Investor Views" },
];

const BOTTOM_ITEMS = [
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

// Admin-only viz items — hidden from regular users
const ADMIN_VIZ_HREFS = new Set([
  "/dashboard/investor-stats",
  "/dashboard/financial-heatmap",
  "/dashboard/correlation",
  "/dashboard/reports",
  "/dashboard/investor-views",
])

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onSelectScenario?: (key: string) => void;
  activeScenario?: string;
  isAdmin?: boolean;
}

function NavLink({ href, icon: Icon, label, collapsed, exact }: {
  href: string; icon: React.ElementType; label: string; collapsed: boolean; exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  const link = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function Sidebar({ collapsed, onToggle, onSelectScenario, activeScenario, isAdmin = false }: SidebarProps) {
  const thesis = useThesisOptional();
  const hasThesis = !!thesis?.activeThesis;
  const [focusMenuOpen, setFocusMenuOpen] = useState(false);

  // All viz items visible to all authenticated users — page-level Paywall handles access control
  const visibleVizItems = VIZ_ITEMS;

  const activeScenarioData = FOCUS_SCENARIOS.find(s => s.key === activeScenario);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-border bg-card transition-all duration-300 shrink-0",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* Logo + toggle */}
        <div className={cn("flex h-14 items-center border-b border-border px-3", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="ThreadMoat" width={120} height={32} className="h-8 w-auto" unoptimized />
            </Link>
          )}
          <button
            onClick={onToggle}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Focus Scenario Selector */}
        {!collapsed ? (
          <div className="border-b border-border px-2 py-2">
            <button
              onClick={() => setFocusMenuOpen(!focusMenuOpen)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Focus className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate flex-1 text-left">
                {activeScenarioData ? activeScenarioData.shortLabel : "Choose Research Focus"}
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", focusMenuOpen && "rotate-180")} />
            </button>
            {focusMenuOpen && (
              <div className="mt-1 space-y-0.5">
                {FOCUS_SCENARIOS.map(s => {
                  const Icon = s.icon;
                  const isActive = activeScenario === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => {
                        onSelectScenario?.(s.key);
                        setFocusMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{s.label}</div>
                        <div className="text-[10px] text-muted-foreground/70 line-clamp-1">{s.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="border-b border-border py-2 px-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    // When collapsed, expand sidebar and open focus menu
                    onToggle();
                    setTimeout(() => setFocusMenuOpen(true), 300);
                  }}
                  className={cn(
                    "flex w-full items-center justify-center rounded-md px-2 py-2 transition-colors",
                    activeScenarioData ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Focus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {activeScenarioData ? activeScenarioData.label : "Choose Research Focus"}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Scrollable nav */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-0.5 px-2">
            {NAV_ITEMS.map(item => (
              <NavLink key={item.href} {...item} collapsed={collapsed} />
            ))}

            {/* Visualizations section */}
            {!collapsed && (
              <p className="mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Visualizations
              </p>
            )}
            {collapsed && <div className="my-2 border-t border-border" />}

            {visibleVizItems.map(item => (
              <NavLink key={item.href} {...item} collapsed={collapsed} />
            ))}

            {/* Admin-only section */}
            {isAdmin && (
              <>
                {!collapsed && (
                  <p className="mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-amber-500/80">
                    Admin Analytics
                  </p>
                )}
                {collapsed && <div className="my-2 border-t border-amber-500/30" />}
                {ADMIN_ITEMS.map(item => (
                  <NavLink key={item.href} {...item} collapsed={collapsed} />
                ))}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Bottom items */}
        <div className="border-t border-border py-2 px-2">
          {BOTTOM_ITEMS.map(item => (
            <NavLink key={item.href} {...item} collapsed={collapsed} />
          ))}
        </div>
      </aside>
    </TooltipProvider>
  );
}
