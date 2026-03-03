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
    const { activeThesis, scoreCompanies } = useThesis();
    const filtered = data.filter(filterCompany);

    const hasThesis = activeThesis === "isv";
    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);

    const whitespace = useMemo(() => scored.filter(r => r.label === "Whitespace"), [scored]);
    const adjacent = useMemo(() => scored.filter(r => r.label === "Adjacent"), [scored]);
    const covered = useMemo(() => scored.filter(r => r.label === "Covered"), [scored]);

    // Integration candidates: whitespace companies with high growth
    const integrationCandidates = useMemo(() =>
        hasThesis
            ? whitespace.filter(r => (r.company.growthMetrics || 0) > 3.5).slice(0, 10)
            : []
    , [hasThesis, whitespace]);

    // Competitive overlap: covered companies (direct competitors)
    const competitors = useMemo(() =>
        hasThesis ? covered.slice(0, 5) : []
    , [hasThesis, covered]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading ISV ecosystem…</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">ISV Intelligence</h1>
                <p className="text-muted-foreground">Ecosystem positioning, integration opportunities, and competitive battlecards.</p>
            </div>

            <VizFilterBar companies={data} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    title={hasThesis ? "Whitespace Opportunities" : "Companies in View"}
                    value={hasThesis ? whitespace.length.toString() : filtered.length.toString()}
                    subtitle={hasThesis ? "Uncovered market areas" : "Set whitespace analysis first"}
                    trend={hasThesis && whitespace.length > 0 ? "up" : undefined}
                    icon={<Network className="size-5" />}
                />
                <KPICard
                    title={hasThesis ? "Adjacent Opportunities" : "Adjacent"}
                    value={hasThesis ? adjacent.length.toString() : "—"}
                    subtitle={hasThesis ? "Partially covered areas" : "Set whitespace analysis first"}
                    icon={<FileWarning className="size-5" />}
                />
                <KPICard
                    title={hasThesis ? "Competitive Overlap" : "Competitors"}
                    value={hasThesis ? covered.length.toString() : "—"}
                    subtitle={hasThesis ? "Fully covered (rivals)" : "Set whitespace analysis first"}
                    icon={<Swords className="size-5" />}
                />
                <KPICard
                    title="Integration Candidates"
                    value={hasThesis ? integrationCandidates.length.toString() : "—"}
                    subtitle={hasThesis ? "High-growth whitespace cos." : "Set whitespace analysis first"}
                    trend={hasThesis && integrationCandidates.length > 0 ? "up" : undefined}
                    icon={<Link2 className="size-5" />}
                />
            </div>

            {!hasThesis && (
                <FocusPrompt label="Set Whitespace Analysis" description="Define your coverage to discover whitespace opportunities, adjacent markets, and integration candidates." />
            )}

            <div className="grid lg:grid-cols-7 gap-6">
                <div className="lg:col-span-4">
                    <WidgetCard title="Ecosystem Connectivity" subtitle="Strategic partnership mapping" href="/dashboard/network">
                        <NetworkGraph data={filtered} className="min-h-[500px]" />
                    </WidgetCard>
                </div>
                <div className="lg:col-span-3">
                    <WidgetCard title="Platform Positioning" subtitle="Momentum vs execution dynamics" href="/dashboard/quadrant">
                        <QuadrantChart data={filtered} className="min-h-[500px]" />
                    </WidgetCard>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <WidgetCard title="Market Taxonomy" subtitle="Investment List distribution" href="/dashboard/sunburst">
                    <SunburstChart data={filtered} className="min-h-[400px]" />
                </WidgetCard>
                <div className="md:col-span-2">
                    <WidgetCard title="Intelligence Master List" subtitle="Complete company metrics breakdown" href="/dashboard/periodic-table">
                        <PeriodicTable data={filtered} compact={true} />
                    </WidgetCard>
                </div>
            </div>
        </div>
    );
}
