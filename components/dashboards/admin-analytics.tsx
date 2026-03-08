"use client";

import dynamic from "next/dynamic";
import { Company } from "@/lib/company-data";
import { WidgetCard } from "@/components/widgets/widget-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { ADMIN_WIDGETS } from "@/lib/widget-registry";

// Lazy-load all advanced charts to avoid bloating the initial bundle
const ReportGenerator = dynamic(() => import("@/components/charts/report-generator").then(m => m.ReportGenerator), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const FinancialHeatmapChart = dynamic(() => import("@/components/charts/financial-heatmap-chart").then(m => m.FinancialHeatmapChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const CorrelationMatrixChart = dynamic(() => import("@/components/charts/correlation-matrix-chart").then(m => m.CorrelationMatrixChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const InvestorStatsChart = dynamic(() => import("@/components/charts/investor-stats-chart").then(m => m.InvestorStatsChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const InvestorViewsChart = dynamic(() => import("@/components/charts/investor-views-chart").then(m => m.InvestorViewsChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const InvestorExplorerChart = dynamic(() => import("@/components/charts/investor-explorer-chart").then(m => m.InvestorExplorerChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const ParallelCoordsChart = dynamic(() => import("@/components/charts/parallel-coords-chart").then(m => m.ParallelCoordsChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const SpiralTimelineChart = dynamic(() => import("@/components/charts/spiral-timeline-chart").then(m => m.SpiralTimelineChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const SlopeChart = dynamic(() => import("@/components/charts/slope-chart").then(m => m.SlopeChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const BoxPlotChart = dynamic(() => import("@/components/charts/box-plot-chart").then(m => m.BoxPlotChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const DistributionChart = dynamic(() => import("@/components/charts/distribution-chart").then(m => m.DistributionChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const HeatmapChart = dynamic(() => import("@/components/charts/heatmap-chart").then(m => m.HeatmapChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const MarimekkoChart = dynamic(() => import("@/components/charts/marimekko-chart").then(m => m.MarimekkoChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const WordcloudChart = dynamic(() => import("@/components/charts/wordcloud-chart").then(m => m.WordcloudChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const ChordChart = dynamic(() => import("@/components/charts/chord-chart").then(m => m.ChordChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const SplomChart = dynamic(() => import("@/components/charts/splom-chart").then(m => m.SplomChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});
const TreemapChart = dynamic(() => import("@/components/charts/treemap-chart").then(m => m.TreemapChart), {
    ssr: false, loading: () => <Skeleton className="w-full min-h-[400px] rounded-lg" />,
});

/** Map widget ID → render function */
const WIDGET_RENDERERS: Record<string, (data: Company[], filteredNames: Set<string>) => React.ReactNode> = {
    "report-generator":   (d) => <ReportGenerator data={d} className="min-h-[400px]" />,
    "financial-heatmap":  (_d, fn) => <FinancialHeatmapChart filteredCompanyNames={fn} className="min-h-[400px]" />,
    "correlation-matrix": (d) => <CorrelationMatrixChart data={d} className="min-h-[400px]" />,
    "investor-stats":     (d) => <InvestorStatsChart data={d} className="min-h-[400px]" />,
    "investor-views":     (d) => <InvestorViewsChart data={d} className="min-h-[400px]" />,
    "investor-explorer":  (d) => <InvestorExplorerChart data={d} className="min-h-[400px]" />,
    "parallel-coords":    (d) => <ParallelCoordsChart data={d} className="min-h-[400px]" />,
    "spiral-timeline":    (d) => <SpiralTimelineChart data={d} className="min-h-[400px]" />,
    "slope-chart":        (d) => <SlopeChart data={d} className="min-h-[400px]" />,
    "box-plot":           (d) => <BoxPlotChart data={d} className="min-h-[400px]" />,
    "distribution":       (d) => <DistributionChart data={d} className="min-h-[400px]" />,
    "heatmap":            (d) => <HeatmapChart data={d} className="min-h-[400px]" />,
    "marimekko":          (d) => <MarimekkoChart data={d} className="min-h-[400px]" />,
    "wordcloud":          (d) => <WordcloudChart data={d} className="min-h-[400px]" />,
    "chord":              (d) => <ChordChart data={d} className="min-h-[400px]" />,
    "splom":              (d) => <SplomChart data={d} className="min-h-[400px]" />,
    "treemap":            (d) => <TreemapChart data={d} className="min-h-[400px]" />,
};

interface AdminAnalyticsSectionProps {
    data: Company[];
    filtered: Company[];
    enabledWidgets: string[];
}

export function AdminAnalyticsSection({ data, filtered, enabledWidgets }: AdminAnalyticsSectionProps) {
    const displayData = filtered.length > 0 ? filtered : data;
    const filteredNames = useMemo(
        () => new Set(displayData.map(c => c.name)),
        [displayData]
    );

    // Only render admin widgets that are enabled in the layout
    const visibleWidgets = ADMIN_WIDGETS.filter(w => enabledWidgets.includes(w.id));

    if (visibleWidgets.length === 0) return null;

    return (
        <div className="space-y-6 mt-8">
            <div className="border-t pt-6">
                <h2 className="text-xl font-bold tracking-tight">Advanced Analytics</h2>
                <p className="text-sm text-muted-foreground">Admin-only deep analysis tools</p>
            </div>

            {visibleWidgets.map(w => {
                const render = WIDGET_RENDERERS[w.id];
                if (!render) return null;
                return (
                    <WidgetCard key={w.id} title={w.label} subtitle="">
                        {render(displayData, filteredNames)}
                    </WidgetCard>
                );
            })}
        </div>
    );
}
