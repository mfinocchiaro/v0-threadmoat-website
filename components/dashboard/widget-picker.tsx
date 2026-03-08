"use client";

import { getAvailableWidgets } from "@/lib/widget-registry";
import { useLayout } from "@/contexts/layout-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { RotateCcw, Shield } from "lucide-react";

interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: string;
  isAdmin: boolean;
}

export function WidgetPicker({ open, onOpenChange, scenario, isAdmin }: WidgetPickerProps) {
  const { getEnabledWidgets, toggleWidget, resetLayout } = useLayout();
  const enabled = getEnabledWidgets(scenario);
  const available = getAvailableWidgets(scenario, isAdmin);

  const standardWidgets = available.filter(w => !w.adminOnly);
  const adminWidgets = available.filter(w => w.adminOnly);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Customize Dashboard</SheetTitle>
          <SheetDescription>Toggle widgets on or off. Changes save automatically.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Charts</h3>
            <div className="space-y-3">
              {standardWidgets.map(w => (
                <label key={w.id} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">{w.label}</span>
                  <Switch
                    checked={enabled.includes(w.id)}
                    onCheckedChange={() => toggleWidget(scenario, w.id)}
                  />
                </label>
              ))}
            </div>
          </div>

          {adminWidgets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shield className="size-3.5" />
                Advanced Analytics
              </h3>
              <div className="space-y-3">
                {adminWidgets.map(w => (
                  <label key={w.id} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">{w.label}</span>
                    <Switch
                      checked={enabled.includes(w.id)}
                      onCheckedChange={() => toggleWidget(scenario, w.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => resetLayout(scenario)}
          >
            <RotateCcw className="mr-2 size-3.5" />
            Reset to Defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
