"use client";

import React, { useMemo } from "react";
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Company, formatCurrency } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { cn } from "@/lib/utils";

interface BarChartProps {
    data: Company[];
    className?: string;
}

const METRICS = {
    totalFunding: { label: "Total Funding", format: formatCurrency, color: "hsl(var(--chart-1))" },
    weightedScore: { label: "Weighted Score", format: (v: number) => v.toFixed(2), color: "hsl(var(--chart-2))" },
    headcount: { label: "Headcount", format: (v: number) => v.toString(), color: "hsl(var(--chart-3))" },
    marketOpportunity: { label: "Market Opportunity", format: (v: number) => v.toFixed(1), color: "hsl(var(--chart-4))" },
};

export function BarChart({ data, className }: BarChartProps) {
    const { filterCompany } = useFilter();
    const [metric, setMetric] = React.useState<keyof typeof METRICS>("totalFunding");
    const [topCount] = React.useState(25);

    const chartData = useMemo(() => {
        return data
            .filter(filterCompany)
            .sort((a, b) => (b[metric] as number) - (a[metric] as number))
            .slice(0, topCount)
            .map(c => {
                const words = c.name.split(/\s+/).filter(Boolean);
                const initials = words.length >= 2
                    ? (words[0][0] + words[1][0]).toUpperCase()
                    : c.name.substring(0, 2).toUpperCase();
                return {
                    name: c.name,
                    initials,
                    value: c[metric],
                    fullCompany: c,
                };
            });
    }, [data, filterCompany, metric, topCount]);

    const activeConfig = METRICS[metric];

    if (chartData.length === 0) {
        return (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                No data available for this selection.
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
                {Object.entries(METRICS).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => setMetric(key as keyof typeof METRICS)}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                            metric === key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        {config.label}
                    </button>
                ))}
                <div className="ml-auto text-xs text-muted-foreground">Top {topCount}</div>
            </div>

            <div className="h-[600px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} opacity={0.3} />
                        <XAxis
                            type="number"
                            tickFormatter={(value) => {
                                if (metric === "totalFunding") return `$${(value / 1e6).toFixed(0)}M`;
                                return value.toString();
                            }}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                        />
                        <YAxis
                            dataKey="initials"
                            type="category"
                            width={50}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-popover border text-popover-foreground p-2 rounded shadow-md text-xs">
                                            <div className="font-bold mb-1">{d.name}</div>
                                            <div>{activeConfig.label}: {activeConfig.format(d.value as number)}</div>
                                            <div className="text-muted-foreground mt-1">{d.fullCompany.investmentList}</div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="value"
                            fill={activeConfig.color}
                            radius={[0, 4, 4, 0]}
                            barSize={12}
                        />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
