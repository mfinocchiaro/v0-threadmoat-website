"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: "up" | "down" | "stable";
    delta?: string;
    icon?: ReactNode;
    className?: string;
    onClick?: () => void;
    active?: boolean;
}

const TREND_ICONS = { up: TrendingUp, down: TrendingDown, stable: Minus };
const TREND_COLORS = { up: "text-emerald-500", down: "text-red-500", stable: "text-muted-foreground" };

export function KPICard({ title, value, subtitle, trend, delta, icon, className, onClick, active }: KPICardProps) {
    const TrendIcon = trend ? TREND_ICONS[trend] : null;

    return (
        <Card className={cn("relative overflow-hidden", onClick && "cursor-pointer hover:border-primary/50 transition-colors", active && "border-primary ring-1 ring-primary/20", className)} onClick={onClick}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
                        <p className="text-2xl font-bold mt-1 truncate">{value}</p>
                        {(subtitle || delta) && (
                            <div className="flex items-center gap-2 mt-1">
                                {delta && trend && TrendIcon && (
                                    <span className={cn("flex items-center text-xs font-medium", TREND_COLORS[trend])}>
                                        <TrendIcon className="size-3 mr-0.5" />{delta}
                                    </span>
                                )}
                                {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
