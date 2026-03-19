"use client";

import { Company, formatCurrency } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { useThesis, ScoredCompany } from "@/contexts/thesis-context";
import { useLayout } from "@/contexts/layout-context";
import { KPICard } from "@/components/widgets/kpi-card";
import { WidgetCard } from "@/components/widgets/widget-card";
import { VizFilterBar } from "@/components/viz-filter-bar";
import { LandscapeChart } from "@/components/charts/landscape-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PeriodicTable } from "@/components/charts/periodic-table";
import { QuadrantChart } from "@/components/charts/quadrant-chart";
import { NetworkGraphToggle } from "@/components/charts/network-graph-toggle";
import { AdminAnalyticsSection } from "./admin-analytics";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Globe, TrendingUp, Users, X, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";

const SCENARIO = "startup_founder";

export function StartupDashboard({ data, isLoading, isAdmin = false }: { data: Company[]; isLoading: boolean; isAdmin?: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, scoreCompanies } = useThesis();
    const { getEnabledWidgets } = useLayout();
    const enabled = getEnabledWidgets(SCENARIO);

    const hasThesis = activeThesis === "founder";
    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);
    const matches = useMemo(() => scored.filter(r => r.score >= 30), [scored]);
    const displayData = useMemo(() => hasThesis ? matches.map(r => r.company) : [], [hasThesis, matches]);
    const filtered = displayData.filter(filterCompany);

    type DrillCategory = "competitors" | null;
    const [drillDown, setDrillDown] = useState<DrillCategory>(null);
    const toggleDrill = (cat: DrillCategory) => setDrillDown(prev => prev === cat ? null : cat);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading ecosystem data...</div>;

    const totalFunding = filtered.reduce((s, c) => s + (c.totalFunding || 0), 0);
    const avgScore = matches.length > 0
        ? (matches.reduce((s, r) => s + (r.company.weightedScore || 0), 0) / matches.length).toFixed(1)
        : "\u2014";
    const totalHeadcount = filtered.reduce((s, c) => s + (c.headcount || 0), 0);
    const countries = new Set(filtered.map(c => c.country).filter(Boolean)).size;

    const show = (id: string) => enabled.includes(id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Startup Intelligence</h1>
                <p className="text-muted-foreground">{hasThesis ? `${matches.length} competitors found.` : "Configure your competitive moat to see results."}</p>
            </div>

            {hasThesis && <VizFilterBar companies={displayData} />}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard title="Competitors Found" value={hasThesis ? matches.length.toString() : "\u2014"} subtitle={hasThesis ? `from ${data.length} companies` : "Set focus to populate"} icon={<DollarSign className="size-4" />} onClick={hasThesis && matches.length > 0 ? () => toggleDrill("competitors") : undefined} active={drillDown === "competitors"} />
                <KPICard title="Avg. Competitor Score" value={hasThesis ? avgScore : "\u2014"} subtitle="Weighted moat score" icon={<TrendingUp className="size-4" />} />
                <KPICard title="Total Headcount" value={hasThesis ? totalHeadcount.toLocaleString() : "\u2014"} subtitle="Competitor talent pool" icon={<Users className="size-4" />} />
                <KPICard title="Market Reach" value={hasThesis ? String(countries) : "\u2014"} subtitle="Countries active" icon={<Globe className="size-4" />} />
            </div>

            {/* Empty state guidance */}
            {hasThesis && matches.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/20 p-8 text-center">
                    <Settings2 className="size-6 text-muted-foreground" />
                    <p className="text-sm font-medium">No competitors match your current filters</p>
                    <p className="text-xs text-muted-foreground max-w-md">
                        Try broadening your criteria — select more investment lists, remove subcategory filters, or adjust your score weights in the configuration panel.
                    </p>
                </div>
            )}

            {/* Full drill-down list */}
            {drillDown === "competitors" && matches.length > 0 && (
                <WidgetCard title="All Competitors" subtitle={`${matches.length} companies ranked by match score`}>
                    <div className="flex justify-end mb-2">
                        <button onClick={() => setDrillDown(null)} className="text-xs text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {matches.map(({ company: c, score }) => (
                            <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg border text-sm">
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium">{c.name}</span>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {c.investmentList}{c.subcategories ? ` · ${c.subcategories}` : ""}{c.country ? ` · ${c.country}` : ""}
                                    </p>
                                </div>
                                {c.latestFundingRound && <Badge variant="outline" className="shrink-0 text-xs">{c.latestFundingRound}</Badge>}
                                <div className="text-right shrink-0 text-xs font-medium tabular-nums">{score}%</div>
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

            {hasThesis && filtered.length > 0 && show("landscape") && (
                <WidgetCard title="Competitive Landscape" subtitle={`${filtered.length} competitors`}>
                    <LandscapeChart data={filtered} className="min-h-[500px]" />
                </WidgetCard>
            )}
            {hasThesis && filtered.length > 0 && show("periodic-table") && (
                <WidgetCard title="Periodic Table" subtitle={`${filtered.length} competitors`}>
                    <PeriodicTable data={filtered} compact={true} />
                </WidgetCard>
            )}
            {hasThesis && filtered.length > 0 && show("quadrant") && (
                <WidgetCard title="Competitive Quadrant" subtitle="Market momentum vs execution">
                    <QuadrantChart data={filtered} className="h-[500px]" />
                </WidgetCard>
            )}
            {hasThesis && filtered.length > 0 && show("bar") && (
                <WidgetCard title="Top Rankings" subtitle={`Top from ${filtered.length} competitors`}>
                    <BarChart data={filtered} />
                </WidgetCard>
            )}

            {isAdmin && <AdminAnalyticsSection data={data} filtered={filtered} enabledWidgets={enabled} />}
        </div>
    );
}
