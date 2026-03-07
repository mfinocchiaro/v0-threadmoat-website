"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
    href?: string; // kept for API compat but ignored — no page navigation
}

export function WidgetCard({ title, subtitle, children, className }: WidgetCardProps) {
    return (
        <Card className={cn("relative overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
            </CardHeader>
            <CardContent className="pb-3">{children}</CardContent>
        </Card>
    );
}
