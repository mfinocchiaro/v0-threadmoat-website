"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { FilterToolbar } from "./filter-toolbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Session } from "next-auth";
import type { AccessTier } from "@/lib/tiers";

interface Profile {
  full_name?: string;
  company?: string;
  title?: string;
  profile_type?: string;
}

export function SidebarShell({
  user,
  profile,
  children,
  onSelectScenario,
  activeScenario,
  isAdmin = false,
  isFreeUser = false,
  accessTier = 'explorer',
}: {
  user: Session["user"];
  profile?: Profile;
  children: React.ReactNode;
  onSelectScenario?: (key: string) => void;
  activeScenario?: string;
  isAdmin?: boolean;
  isFreeUser?: boolean;
  accessTier?: AccessTier;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  // Close mobile sheet on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggle() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  const sidebarProps = {
    collapsed: false, // always expanded in mobile sheet
    onToggle: () => setMobileOpen(false),
    onSelectScenario,
    activeScenario,
    isAdmin,
    isFreeUser,
    accessTier,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={collapsed}
          onToggle={toggle}
          onSelectScenario={onSelectScenario}
          activeScenario={activeScenario}
          isAdmin={isAdmin}
          isFreeUser={isFreeUser}
          accessTier={accessTier}
        />
      </div>

      {/* Mobile sidebar — Sheet from left */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-56 p-0 [&>button]:hidden">
          <Sidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          user={user}
          profile={profile}
          showMenuButton
          onMenuClick={() => setMobileOpen(true)}
        />
        <div
          className="shrink-0 border-b border-amber-500/20 bg-amber-500/5 px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400"
          title="All financial estimates, scores, funding figures, and market data presented in this platform are research-based approximations compiled from public sources, analyst reports, and industry signals. They may contain errors or omissions and are not verified by the companies listed. This platform does not constitute investment advice, legal counsel, or a substitute for professional due diligence. Caveat emptor — use as a brainstorming and screening tool only."
        >
          ⚠ Research estimates only — figures are educated approximations from public sources and may contain errors. Not investment advice. Always conduct your own due diligence.
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <FilterToolbar />
          <div className="mx-auto px-3 sm:px-6 py-4 sm:py-6 max-w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
