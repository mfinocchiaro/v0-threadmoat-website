"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { DEFAULT_LAYOUT } from "@/lib/widget-registry";

type DashboardLayout = Record<string, string[]>;

interface LayoutContextValue {
  /** Get enabled widget IDs for a scenario */
  getEnabledWidgets: (scenario: string) => string[];
  /** Toggle a widget on/off for a scenario */
  toggleWidget: (scenario: string, widgetId: string) => void;
  /** Reset a scenario to defaults */
  resetLayout: (scenario: string) => void;
  /** Whether layout has been loaded from DB */
  loaded: boolean;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children, initialLayout }: { children: ReactNode; initialLayout?: DashboardLayout | null }) {
  const [layout, setLayout] = useState<DashboardLayout>(initialLayout ?? {});
  const [loaded, setLoaded] = useState(!!initialLayout);

  // Load layout from API on mount if not provided
  useEffect(() => {
    if (initialLayout !== undefined) return;
    fetch("/api/profile/layout")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.layout) setLayout(data.layout);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [initialLayout]);

  const getEnabledWidgets = useCallback((scenario: string): string[] => {
    return layout[scenario] ?? DEFAULT_LAYOUT[scenario] ?? [];
  }, [layout]);

  const saveLayout = useCallback((newLayout: DashboardLayout) => {
    fetch("/api/profile/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout: newLayout }),
    }).catch(console.error);
  }, []);

  const toggleWidget = useCallback((scenario: string, widgetId: string) => {
    setLayout(prev => {
      const current = prev[scenario] ?? DEFAULT_LAYOUT[scenario] ?? [];
      const next = current.includes(widgetId)
        ? current.filter(id => id !== widgetId)
        : [...current, widgetId];
      const updated = { ...prev, [scenario]: next };
      saveLayout(updated);
      return updated;
    });
  }, [saveLayout]);

  const resetLayout = useCallback((scenario: string) => {
    setLayout(prev => {
      const updated = { ...prev, [scenario]: DEFAULT_LAYOUT[scenario] ?? [] };
      saveLayout(updated);
      return updated;
    });
  }, [saveLayout]);

  return (
    <LayoutContext.Provider value={{ getEnabledWidgets, toggleWidget, resetLayout, loaded }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be inside LayoutProvider");
  return ctx;
}
