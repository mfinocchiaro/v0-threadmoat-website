"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import type { Session } from "next-auth";

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
}: {
  user: Session["user"];
  profile?: Profile;
  children: React.ReactNode;
  onSelectScenario?: (key: string) => void;
  activeScenario?: string;
  isAdmin?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  function toggle() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        onSelectScenario={onSelectScenario}
        activeScenario={activeScenario}
        isAdmin={isAdmin}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={user} profile={profile} />
        <div
          className="shrink-0 border-b border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-[11px] text-amber-700 dark:text-amber-400"
          title="All financial estimates, scores, funding figures, and market data presented in this platform are research-based approximations compiled from public sources, analyst reports, and industry signals. They may contain errors or omissions and are not verified by the companies listed. This platform does not constitute investment advice, legal counsel, or a substitute for professional due diligence. Caveat emptor — use as a brainstorming and screening tool only."
        >
          ⚠ Research estimates only — figures are educated approximations from public sources and may contain errors. Not investment advice. Always conduct your own due diligence.
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
