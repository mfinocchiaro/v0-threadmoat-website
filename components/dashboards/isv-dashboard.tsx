"use client";

import { Company } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { useThesis } from "@/contexts/thesis-context";
import { useLayout } from "@/contexts/layout-context";
import { KPICard } from "@/components/widgets/kpi-card";
import { WidgetCard } from "@/components/widgets/widget-card";
import { VizFilterBar } from "@/components/viz-filter-bar";
import { NetworkGraphToggle } from "@/components/charts/network-graph-toggle";
import { PeriodicTable } from "@/components/charts/periodic-table";
import { QuadrantChart } from "@/components/charts/quadrant-chart";
import { SunburstChart } from "@/components/charts/sunburst-chart";
import { AdminAnalyticsSection } from "./admin-analytics";
import { Network, FileWarning, Swords, Link2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScoredCompany } from "@/contexts/thesis-context";

const SCENARIO = "isv_platform";

export function ISVDashboard({ data, isLoading, isAdmin = false }: { data: Company[]; isLoading: boolean; isAdmin?: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, scoreCompanies } = useThesis();
    const { getEnabledWidgets } = useLayout();
    const enabled = getEnabledWidgets(SCENARIO);

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

    type DrillCategory = "whitespace" | "adjacent" | "covered" | "integration" | null;
    const [drillDown, setDrillDown] = useState<DrillCategory>(null);

    const drillData = useMemo((): ScoredCompany[] => {
        switch (drillDown) {
            case "whitespace": return whitespace;
            case "adjacent": return adjacent;
            case "covered": return covered;
            case "integration": return integrationCandidates;
            default: return [];
        }
    }, [drillDown, whitespace, adjacent, covered, integrationCandidates]);

    const drillTitle: Record<string, string> = {
        whitespace: "Acquisition Targets",
        adjacent: "Adjacent Opportunities",
        covered: "Competitive Overlap",
        integration: "Integration Candidates",
    };

    const toggleDrill = (cat: DrillCategory) => setDrillDown(prev => prev === cat ? null : cat);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading acquisition radar...</div>;

    const show = (id: string) => enabled.includes(id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Targeted Acquisition Radar</h1>
                <p className="text-muted-foreground">{hasThesis ? `${displayData.length} opportunities found.` : "Configure your acquisition radar to see results."}</p>
            </div>

            {hasThesis && <VizFilterBar companies={displayData} />}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Acquisition Targets" value={hasThesis ? whitespace.length.toString() : "\u2014"} subtitle={hasThesis ? "Uncovered market areas" : "Set focus to populate"} icon={<Network className="size-5" />} onClick={hasThesis && whitespace.length > 0 ? () => toggleDrill("whitespace") : undefined} active={drillDown === "whitespace"} />
                <KPICard title="Adjacent Opportunities" value={hasThesis ? adjacent.length.toString() : "\u2014"} subtitle="Partially covered areas" icon={<FileWarning className="size-5" />} onClick={hasThesis && adjacent.length > 0 ? () => toggleDrill("adjacent") : undefined} active={drillDown === "adjacent"} />
                <KPICard title="Competitive Overlap" value={hasThesis ? covered.length.toString() : "\u2014"} subtitle="Fully covered (rivals)" icon={<Swords className="size-5" />} onClick={hasThesis && covered.length > 0 ? () => toggleDrill("covered") : undefined} active={drillDown === "covered"} />
                <KPICard title="Integration Candidates" value={hasThesis ? integrationCandidates.length.toString() : "\u2014"} subtitle="High-growth target cos." icon={<Link2 className="size-5" />} onClick={hasThesis && integrationCandidates.length > 0 ? () => toggleDrill("integration") : undefined} active={drillDown === "integration"} />
            </div>

            {drillDown && drillData.length > 0 && (
                <WidgetCard title={drillTitle[drillDown] ?? ""} subtitle={`${drillData.length} companies`}>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {drillData.map(({ company: c, score }) => (
                            <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg border text-sm">
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium">{c.name}</span>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.subsegment || c.investmentList}{c.country ? ` · ${c.country}` : ""}</p>
                                </div>
                                {c.latestFundingRound && <Badge variant="outline" className="shrink-0 text-xs">{c.latestFundingRound}</Badge>}
                                <div className="text-right shrink-0 text-xs text-muted-foreground">Score {score}</div>
                            </div>
                        ))}
                    </div>
                </WidgetCard>
            )}

            {show("network") && (
                <WidgetCard title="Ecosystem Network" subtitle={`${data.length} companies`}>
                    <NetworkGraphToggle data={data} className="min-h-[500px]" />
                </WidgetCard>
            )}

            {hasThesis && filtered.length > 0 && show("quadrant") && (
                <WidgetCard title="Platform Positioning" subtitle={`${filtered.length} companies`}>
                    <QuadrantChart data={filtered} className="min-h-[500px]" />
                </WidgetCard>
            )}
            {hasThesis && filtered.length > 0 && show("sunburst") && (
                <WidgetCard title="Market Taxonomy" subtitle={`${filtered.length} companies`}>
                    <SunburstChart data={filtered} className="min-h-[500px]" />
                </WidgetCard>
            )}
            {hasThesis && filtered.length > 0 && show("periodic-table") && (
                <WidgetCard title="Intelligence Master List" subtitle={`${filtered.length} companies`}>
                    <PeriodicTable data={filtered} compact={true} />
                </WidgetCard>
            )}

            {isAdmin && <AdminAnalyticsSection data={data} filtered={filtered} enabledWidgets={enabled} />}
        </div>
    );
}
