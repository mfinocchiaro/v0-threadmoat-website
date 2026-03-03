"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
    href?: string;
}

export function WidgetCard({ title, subtitle, children, className, href }: WidgetCardProps) {
    const router = useRouter();

    function handleClick(e: React.MouseEvent) {
        if (!href) return;
        // Don't navigate if the user clicked an interactive element
        const target = e.target as HTMLElement;
        if (target.closest("button, select, input, textarea, a, [role='combobox'], [role='listbox'], [role='option'], [data-radix-popper-content-wrapper]")) return;
        router.push(href);
    }

    return (
        <Card
            className={cn("relative overflow-hidden", href && "cursor-pointer transition-colors hover:border-primary/40", className)}
            onClick={handleClick}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    {href && <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />}
                </div>
                {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
            </CardHeader>
            <CardContent className="pb-3">{children}</CardContent>
        </Card>
    );
}
