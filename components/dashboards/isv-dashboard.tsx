"use client";

import { Company } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { useThesis } from "@/contexts/thesis-context";
import { KPICard } from "@/components/widgets/kpi-card";
import { WidgetCard } from "@/components/widgets/widget-card";
import { VizFilterBar } from "@/components/viz-filter-bar";
import { NetworkGraph } from "@/components/charts/network-graph";
import { PeriodicTable } from "@/components/charts/periodic-table";
import { QuadrantChart } from "@/components/charts/quadrant-chart";
import { SunburstChart } from "@/components/charts/sunburst-chart";
import { Network, FileWarning, Swords, Link2 } from "lucide-react";
import { FocusPrompt } from "@/components/dashboard/focus-prompt";
import { useMemo } from "react";

export function ISVDashboard({ data, isLoading }: { data: Company[]; isLoading: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, activeConfig, scoreCompanies } = useThesis();

    const hasThesis = activeThesis === "isv";
    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);

    const whitespace = useMemo(() => scored.filter(r => r.label === "Whitespace"), [scored]);
    const adjacent = useMemo(() => scored.filter(r => r.label === "Adjacent"), [scored]);
    const covered = useMemo(() => scored.filter(r => r.label === "Covered"), [scored]);

    const displayData = useMemo(() =>
        hasThesis
            ? scored.filter(r => r.label !== "Covered").map(r => r.company)
            : data
    , [hasThesis, scored, data]);
    const filtered = displayData.filter(filterCompany);

    const integrationCandidates = useMemo(() =>
        hasThesis
            ? whitespace.filter(r => (r.company.growthMetrics || 0) > 3.5).slice(0, 10)
            : []
    , [hasThesis, whitespace]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading acquisition radar...</div>;

    const focusLabel = activeConfig?.buttonText ?? "Set Acquisition Radar";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Targeted Acquisition Radar</h1>
                <p className="text-muted-foreground">{hasThesis ? `${displayData.length} opportunities from ${data.length} companies.` : `${data.length} companies across all domains.`}</p>
            </div>

            {!hasThesis && <FocusPrompt label={focusLabel} description="Define your coverage to discover acquisition targets, adjacent markets, and integration candidates." />}

            {hasThesis && <VizFilterBar companies={displayData} />}

            {hasThesis && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    title="Acquisition Targets"
                    value={whitespace.length.toString()}
                    subtitle="Uncovered market areas"
                    trend={whitespace.length > 0 ? "up" : undefined}
                    icon={<Network className="size-5" />}
                />
                <KPICard
                    title="Adjacent Opportunities"
                    value={adjacent.length.toString()}
                    subtitle="Partially covered areas"
                    icon={<FileWarning className="size-5" />}
                />
                <KPICard
                    title="Competitive Overlap"
                    value={covered.length.toString()}
                    subtitle="Fully covered (rivals)"
                    icon={<Swords className="size-5" />}
                />
                <KPICard
                    title="Integration Candidates"
                    value={integrationCandidates.length.toString()}
                    subtitle="High-growth target cos."
                    trend={integrationCandidates.length > 0 ? "up" : undefined}
                    icon={<Link2 className="size-5" />}
                />
            </div>}

            <WidgetCard title="Ecosystem Connectivity" subtitle={`${filtered.length} companies`} href="/dashboard/network">
                <NetworkGraph data={filtered} className="min-h-[500px]" />
            </WidgetCard>

            <WidgetCard title="Platform Positioning" subtitle={`${filtered.length} companies`} href="/dashboard/quadrant">
                <QuadrantChart data={filtered} className="min-h-[500px]" />
            </WidgetCard>

            <WidgetCard title="Market Taxonomy" subtitle={`${filtered.length} companies`} href="/dashboard/sunburst">
                <SunburstChart data={filtered} className="min-h-[500px]" />
            </WidgetCard>

            <WidgetCard title="Intelligence Master List" subtitle={`${filtered.length} companies`} href="/dashboard/periodic-table">
                <PeriodicTable data={filtered} compact={true} />
            </WidgetCard>
        </div>
    );
}
