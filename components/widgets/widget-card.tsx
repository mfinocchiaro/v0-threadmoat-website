"use client";

import { ReactNode, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface WidgetCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
    href?: string; // kept for API compat but ignored — no page navigation
    defaultCollapsed?: boolean;
}

export function WidgetCard({ title, subtitle, children, className, defaultCollapsed = false }: WidgetCardProps) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    return (
        <Card className={cn("relative overflow-hidden", className)}>
            <CardHeader
                className="pb-2 cursor-pointer select-none flex flex-row items-center justify-between"
                onClick={() => setCollapsed(c => !c)}
            >
                <div className="min-w-0">
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
                </div>
                <ChevronDown
                    className={cn(
                        "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
                        collapsed && "-rotate-90"
                    )}
                />
            </CardHeader>
            {!collapsed && <CardContent className="pb-3">{children}</CardContent>}
        </Card>
    );
}
