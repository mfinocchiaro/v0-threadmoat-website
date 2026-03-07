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
import { useMemo } from "react";

export function ISVDashboard({ data, isLoading }: { data: Company[]; isLoading: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, scoreCompanies } = useThesis();

    const hasThesis = activeThesis === "isv";
    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);

    const whitespace = useMemo(() => scored.filter(r => r.label === "Whitespace"), [scored]);
    const adjacent = useMemo(() => scored.filter(r => r.label === "Adjacent"), [scored]);
    const covered = useMemo(() => scored.filter(r => r.label === "Covered"), [scored]);

    const displayData = useMemo(() =>
        hasThesis ? scored.filter(r => r.label !== "Covered").map(r => r.company) : []
    , [hasThesis, scored]);
    const filtered = displayData.filter(filterCompany);

    const integrationCandidates = useMemo(() =>
        hasThesis ? whitespace.filter(r => (r.company.growthMetrics || 0) > 3.5).slice(0, 10) : []
    , [hasThesis, whitespace]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading acquisition radar...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Targeted Acquisition Radar</h1>
                <p className="text-muted-foreground">{hasThesis ? `${displayData.length} opportunities found.` : "Configure your acquisition radar to see results."}</p>
            </div>

            {hasThesis && <VizFilterBar companies={displayData} />}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Acquisition Targets" value={hasThesis ? whitespace.length.toString() : "\u2014"} subtitle={hasThesis ? "Uncovered market areas" : "Set focus to populate"} icon={<Network className="size-5" />} />
                <KPICard title="Adjacent Opportunities" value={hasThesis ? adjacent.length.toString() : "\u2014"} subtitle="Partially covered areas" icon={<FileWarning className="size-5" />} />
                <KPICard title="Competitive Overlap" value={hasThesis ? covered.length.toString() : "\u2014"} subtitle="Fully covered (rivals)" icon={<Swords className="size-5" />} />
                <KPICard title="Integration Candidates" value={hasThesis ? integrationCandidates.length.toString() : "\u2014"} subtitle="High-growth target cos." icon={<Link2 className="size-5" />} />
            </div>

            <WidgetCard title="Ecosystem Network" subtitle={`${data.length} companies`}>
                <NetworkGraph data={data} className="min-h-[500px]" />
            </WidgetCard>

            {hasThesis && filtered.length > 0 && (
                <>
                    <WidgetCard title="Platform Positioning" subtitle={`${filtered.length} companies`}>
                        <QuadrantChart data={filtered} className="min-h-[500px]" />
                    </WidgetCard>
                    <WidgetCard title="Market Taxonomy" subtitle={`${filtered.length} companies`}>
                        <SunburstChart data={filtered} className="min-h-[500px]" />
                    </WidgetCard>
                    <WidgetCard title="Intelligence Master List" subtitle={`${filtered.length} companies`}>
                        <PeriodicTable data={filtered} compact={true} />
                    </WidgetCard>
                </>
            )}
        </div>
    );
}
