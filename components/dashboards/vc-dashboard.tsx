"use client";

import dynamic from "next/dynamic";
import { Company, formatCurrency } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { useThesis } from "@/contexts/thesis-context";
import { KPICard } from "@/components/widgets/kpi-card";
import { WidgetCard } from "@/components/widgets/widget-card";
import { VizFilterBar } from "@/components/viz-filter-bar";
import { BubbleChart } from "@/components/charts/bubble-chart";
import { QuadrantChart } from "@/components/charts/quadrant-chart";
import { PeriodicTable } from "@/components/charts/periodic-table";
import { AlertTriangle, BarChart3, Target, TrendingDown } from "lucide-react";
import { FocusPrompt } from "@/components/dashboard/focus-prompt";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const MapChart = dynamic(() => import("@/components/charts/map-chart").then(m => m.MapChart), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full min-h-[450px] rounded-lg" />,
});

export function VCDashboard({ data, isLoading }: { data: Company[]; isLoading: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, scoreCompanies } = useThesis();
    const filtered = data.filter(filterCompany);

    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);
    const matches = useMemo(() => scored.filter(r => r.score >= 50), [scored]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading portfolio data…</div>;

    const hasThesis = activeThesis === "vc" || activeThesis === "founder";

    // KPI values — thesis-driven when active, factual when not
    const kpi1Value = hasThesis ? matches.length.toString() : filtered.length.toString();
    const kpi1Label = hasThesis ? "Thesis Matches" : "Companies in View";
    const kpi1Sub = hasThesis ? `from ${data.length} total` : "Apply a thesis to filter";

    const avgScore = filtered.length > 0
        ? (filtered.reduce((s, c) => s + (c.weightedScore || 0), 0) / filtered.length).toFixed(1)
        : "0.0";
    const matchAvgScore = matches.length > 0
        ? (matches.reduce((s, r) => s + r.score, 0) / matches.length).toFixed(0)
        : "0";

    const totalPipeline = hasThesis
        ? matches.reduce((s, r) => s + (r.company.totalFunding || 0), 0)
        : filtered.reduce((s, c) => s + (c.totalFunding || 0), 0);

    // Red flags: only when thesis active — companies matching thesis with low funding efficiency
    const redFlags = useMemo(() => {
        if (!hasThesis) return [];
        return matches
            .filter(r => (r.company.fundingEfficiency || 0) < 3 && (r.company.totalFunding || 0) > 1_000_000)
            .slice(0, 3);
    }, [hasThesis, matches]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Investor Intelligence</h1>
                <p className="text-muted-foreground">Deal flow analysis, portfolio tracking, and market landscape mapping.</p>
            </div>

            <VizFilterBar companies={data} />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 row-span-2">
                    <WidgetCard title="Global Deal Flow & Portfolio" subtitle="Geographic distribution of opportunities" className="h-full min-h-[500px]" href="/dashboard/map">
                        <MapChart data={data} className="h-full min-h-[450px]" />
                    </WidgetCard>
                </div>

                <div className="space-y-4">
                    <KPICard title={kpi1Label} value={kpi1Value} subtitle={kpi1Sub} trend={hasThesis ? "up" : undefined} icon={<Target className="size-4" />} />
                    <KPICard
                        title={hasThesis ? "Avg. Match Score" : "Avg. Moat Score"}
                        value={hasThesis ? `${matchAvgScore}%` : avgScore}
                        subtitle={hasThesis ? "Across thesis matches" : "All companies in view"}
                        icon={<BarChart3 className="size-4" />}
                    />
                    {hasThesis && redFlags.length > 0 ? (
                        <WidgetCard title="Burn Warnings" subtitle="Thesis matches with low funding efficiency">
                            <div className="space-y-3">
                                {redFlags.map(({ company: c }) => (
                                    <div key={c.id} className="flex items-start gap-3 p-2 bg-red-50/10 border border-red-200/20 rounded">
                                        <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />
                                        <div>
                                            <div className="text-sm font-semibold">{c.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Funding efficiency: {c.fundingEfficiency?.toFixed(1)}/10 · {formatCurrency(c.totalFunding || 0)} raised
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </WidgetCard>
                    ) : (
                        <FocusPrompt label="Set Investment Thesis" description="Define your deal criteria to see burn warnings, match scores, and pipeline insights." />
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <WidgetCard title="Funding Distribution" subtitle="Momentum vs round size" href="/dashboard/bubbles">
                    <BubbleChart data={filtered} className="h-[400px]" />
                </WidgetCard>
                <WidgetCard title="Competitive Positioning" subtitle="Market presence vs execution" href="/dashboard/quadrant">
                    <QuadrantChart data={filtered} className="h-[400px]" />
                </WidgetCard>
            </div>

            <WidgetCard title="Intelligence Master List" subtitle="Quick metrics overview" href="/dashboard/periodic-table">
                <PeriodicTable data={filtered} compact={true} />
            </WidgetCard>
        </div>
    );
}
