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
}: {
  user: Session["user"];
  profile?: Profile;
  children: React.ReactNode;
  onSelectScenario?: (key: string) => void;
  activeScenario?: string;
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
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={user} profile={profile} />
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
