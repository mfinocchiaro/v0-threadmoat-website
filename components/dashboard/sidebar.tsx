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
import { useState, useEffect } from "react";
import { isPathAllowed, type AccessTier } from "@/lib/tiers";
import { Lock } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/explore", icon: Compass, label: "Free Explorer" },
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

interface VizItem {
  href: string
  icon: React.ElementType
  label: string
}

interface TabGroup {
  key: string
  label: string
  icon: React.ElementType
  href: string
  items: VizItem[]
}

export const TAB_GROUPS: TabGroup[] = [
  {
    key: "market",
    label: "Market",
    icon: Compass,
    href: "/dashboard/tab/market",
    items: [
      { href: "/dashboard/landscape-intro", icon: Compass,    label: "Investment Landscape" },
      { href: "/dashboard/quadrant",        icon: GitBranch,  label: "Magic Quadrant" },
      { href: "/dashboard/bubbles",         icon: Circle,     label: "Bubble Chart" },
      { href: "/dashboard/landscape",       icon: LayoutGrid, label: "Landscape" },
      { href: "/dashboard/periodic-table",  icon: Table2,     label: "Periodic Table" },
      { href: "/dashboard/compare",         icon: GitCompare, label: "Compare" },
      { href: "/dashboard/sunburst",        icon: Sun,        label: "Sunburst" },
    ],
  },
  {
    key: "financial",
    label: "Financial",
    icon: BarChart2,
    href: "/dashboard/tab/financial",
    items: [
      { href: "/dashboard/bar-chart", icon: BarChart2,    label: "Bar Chart" },
      { href: "/dashboard/treemap",   icon: TreePine,     label: "Treemap" },
      { href: "/dashboard/marimekko", icon: BarChart3,    label: "Marimekko" },
      { href: "/dashboard/timeline",  icon: Clock,        label: "Timeline" },
      { href: "/dashboard/spiral",    icon: TrendingUp,   label: "Spiral Timeline" },
      { href: "/dashboard/sankey",   icon: Wind,          label: "Sankey Flow" },
      { href: "/dashboard/patterns", icon: GridIcon,      label: "Patterns" },
    ],
  },
  {
    key: "geographic",
    label: "Geographic",
    icon: Map,
    href: "/dashboard/tab/geographic",
    items: [
      { href: "/dashboard/map",      icon: Map,      label: "Geography Map" },
      { href: "/dashboard/metros",   icon: BarChart2, label: "Metro Areas" },
    ],
  },
  {
    key: "network",
    label: "Networks",
    icon: Network,
    href: "/dashboard/tab/network",
    items: [
      { href: "/dashboard/network",          icon: Network,   label: "Startup Ecosystem" },
      { href: "/dashboard/customers",        icon: Users,     label: "Customer Network" },
      { href: "/dashboard/investor-network", icon: GitBranch, label: "Investor Network" },
    ],
  },
  {
    key: "advanced",
    label: "Advanced",
    icon: SlidersHorizontal,
    href: "/dashboard/tab/advanced",
    items: [
      { href: "/dashboard/radar",        icon: Radar,            label: "Radar Chart" },
      { href: "/dashboard/heatmap",      icon: Flame,            label: "Heatmap" },
      { href: "/dashboard/parallel",     icon: SlidersHorizontal, label: "Parallel Coords" },
      { href: "/dashboard/box-plot",     icon: BoxSelect,        label: "Box Plot" },
      { href: "/dashboard/distribution", icon: Activity,         label: "Distribution" },
      { href: "/dashboard/slope",        icon: TrendingUp,       label: "Slope Chart" },
      { href: "/dashboard/splom",        icon: ScatterChart,     label: "Scatter Matrix" },
      { href: "/dashboard/chord",       icon: Link2,            label: "Chord Diagram" },
      { href: "/dashboard/wordcloud",   icon: Type,             label: "Word Cloud" },
    ],
  },
];

const ADMIN_ITEMS = [
  { href: "/dashboard/investor-stats",    icon: Users,     label: "Investor Stats" },
  { href: "/dashboard/financial-heatmap", icon: Flame,     label: "Financial Heatmap" },
  { href: "/dashboard/correlation",       icon: GridIcon,  label: "Correlation Matrix" },
  { href: "/dashboard/reports",           icon: FileText,  label: "Report Generator" },
  { href: "/dashboard/investor-views",    icon: Eye,       label: "Investor Views" },
  { href: "/dashboard/maturity-matrix",   icon: ScatterChart, label: "Maturity Matrix" },
  { href: "/dashboard/swot",             icon: Focus,        label: "SWOT Analysis" },
  { href: "/dashboard/candlestick",     icon: Activity,     label: "Valuation Candlestick" },
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
  "/dashboard/maturity-matrix",
  "/dashboard/swot",
  "/dashboard/candlestick",
])

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onSelectScenario?: (key: string) => void;
  activeScenario?: string;
  isAdmin?: boolean;
  isFreeUser?: boolean;
  accessTier?: AccessTier;
}

function NavLink({ href, icon: Icon, label, collapsed, exact, locked }: {
  href: string; icon: React.ElementType; label: string; collapsed: boolean; exact?: boolean; locked?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  const classes = cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-primary/10 text-primary font-medium"
      : locked
        ? "text-muted-foreground/40 cursor-default"
        : "text-foreground font-medium hover:bg-muted",
    collapsed && "justify-center px-2"
  )

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate flex-1">{label}</span>
          {locked && <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
        </>
      )}
    </>
  )

  const link = locked
    ? <div className={classes}>{content}</div>
    : <Link href={href} className={classes}>{content}</Link>

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {label}{locked ? " (upgrade to access)" : ""}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function TabGroupNav({ group, collapsed, isFreeUser, accessTier = 'explorer', openGroups, toggleGroup }: {
  group: TabGroup
  collapsed: boolean
  isFreeUser: boolean
  accessTier?: AccessTier
  openGroups: Record<string, boolean>
  toggleGroup: (key: string) => void
}) {
  const pathname = usePathname();
  const GroupIcon = group.icon;
  const isGroupActive = group.items.some(i => pathname === i.href) || pathname === group.href;
  const isOpen = openGroups[group.key] ?? false;

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={group.href}
            className={cn(
              "flex items-center justify-center rounded-md px-2 py-2 text-sm transition-colors",
              isGroupActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <GroupIcon className="h-4 w-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {group.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={group.href}
          className={cn(
            "flex flex-1 items-center gap-3 rounded-l-md px-3 py-2 text-sm transition-colors",
            isGroupActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <GroupIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{group.label}</span>
        </Link>
        <button
          onClick={() => toggleGroup(group.key)}
          className={cn(
            "rounded-r-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            isGroupActive && "bg-primary/10"
          )}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
        </button>
      </div>
      {isOpen && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
          {group.items.map(item => (
            <NavLink key={item.href} {...item} collapsed={false} locked={!isPathAllowed(item.href, accessTier)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onToggle, onSelectScenario, activeScenario, isAdmin = false, isFreeUser = false, accessTier = 'explorer' }: SidebarProps) {
  const thesis = useThesisOptional();
  const hasThesis = !!thesis?.activeThesis;
  const pathname = usePathname();
  const [focusMenuOpen, setFocusMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group when user navigates to one of its child pages
  useEffect(() => {
    for (const group of TAB_GROUPS) {
      if (group.items.some(i => pathname === i.href)) {
        setOpenGroups(prev => prev[group.key] ? prev : { ...prev, [group.key]: true });
        break;
      }
    }
  }, [pathname]);

  function toggleGroup(key: string) {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  }

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
            <Link href="/dashboard" className="flex items-center">
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
        <ScrollArea className="flex-1 min-h-0 py-2">
          <nav className="space-y-0.5 px-2">
            {NAV_ITEMS.filter(item => item.href !== "/dashboard/explore" || isFreeUser).map(item => (
              <NavLink key={item.href} {...item} collapsed={collapsed} />
            ))}

            {/* Tab group visualizations */}
            {!collapsed && (
              <p className="mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Visualizations
              </p>
            )}
            {collapsed && <div className="my-2 border-t border-border" />}

            {TAB_GROUPS.map(group => (
              <TabGroupNav
                key={group.key}
                group={group}
                collapsed={collapsed}
                isFreeUser={isFreeUser}
                accessTier={accessTier}
                openGroups={openGroups}
                toggleGroup={toggleGroup}
              />
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
