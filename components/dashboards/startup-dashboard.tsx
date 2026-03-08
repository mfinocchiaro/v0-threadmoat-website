"use client";

import { Company, formatCurrency } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { useThesis } from "@/contexts/thesis-context";
import { useLayout } from "@/contexts/layout-context";
import { KPICard } from "@/components/widgets/kpi-card";
import { WidgetCard } from "@/components/widgets/widget-card";
import { VizFilterBar } from "@/components/viz-filter-bar";
import { LandscapeChart } from "@/components/charts/landscape-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PeriodicTable } from "@/components/charts/periodic-table";
import { QuadrantChart } from "@/components/charts/quadrant-chart";
import { NetworkGraph } from "@/components/charts/network-graph";
import { AdminAnalyticsSection } from "./admin-analytics";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Globe, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";

const SCENARIO = "startup_founder";

export function StartupDashboard({ data, isLoading, isAdmin = false }: { data: Company[]; isLoading: boolean; isAdmin?: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, scoreCompanies } = useThesis();
    const { getEnabledWidgets } = useLayout();
    const enabled = getEnabledWidgets(SCENARIO);

    const hasThesis = activeThesis === "founder";
    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);
    const matches = useMemo(() => scored.filter(r => r.score >= 50), [scored]);
    const displayData = useMemo(() => hasThesis ? matches.map(r => r.company) : [], [hasThesis, matches]);
    const filtered = displayData.filter(filterCompany);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading ecosystem data...</div>;

    const totalFunding = filtered.reduce((s, c) => s + (c.totalFunding || 0), 0);
    const avgScore = matches.length > 0
        ? (matches.reduce((s, r) => s + (r.company.weightedScore || 0), 0) / matches.length).toFixed(1)
        : "\u2014";
    const totalHeadcount = filtered.reduce((s, c) => s + (c.headcount || 0), 0);
    const countries = new Set(filtered.map(c => c.country).filter(Boolean)).size;
    const topCompetitors = matches.slice(0, 5);

    const show = (id: string) => enabled.includes(id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Startup Intelligence</h1>
                <p className="text-muted-foreground">{hasThesis ? `${matches.length} competitors found.` : "Configure your competitive moat to see results."}</p>
            </div>

            {hasThesis && <VizFilterBar companies={displayData} />}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard title="Competitors Found" value={hasThesis ? matches.length.toString() : "\u2014"} subtitle={hasThesis ? `from ${data.length} companies` : "Set focus to populate"} icon={<DollarSign className="size-4" />} />
                <KPICard title="Avg. Competitor Score" value={hasThesis ? avgScore : "\u2014"} subtitle="Weighted moat score" icon={<TrendingUp className="size-4" />} />
                <KPICard title="Total Headcount" value={hasThesis ? totalHeadcount.toLocaleString() : "\u2014"} subtitle="Competitor talent pool" icon={<Users className="size-4" />} />
                <KPICard title="Market Reach" value={hasThesis ? String(countries) : "\u2014"} subtitle="Countries active" icon={<Globe className="size-4" />} />
            </div>

            {hasThesis && topCompetitors.length > 0 && (
                <WidgetCard title="Top Competitors" subtitle="Highest-scoring companies matching your competitive moat">
                    <div className="space-y-3">
                        {topCompetitors.map(({ company: c, score }) => (
                            <HoverCard key={c.id} openDelay={200} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                    <div className="bg-muted p-3 rounded-lg border-l-4 border-amber-500 cursor-default">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-semibold text-sm">{c.name}</h4>
                                            <span className="text-sm font-medium">{score}% match</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {c.investmentList} · {c.country} · Score: {c.weightedScore} · {formatCurrency(c.totalFunding || 0)} raised
                                        </p>
                                    </div>
                                </HoverCardTrigger>
                                <HoverCardContent side="left" className="w-80">
                                    <div className="space-y-2">
                                        <div className="font-semibold text-sm">{c.name}</div>
                                        <div className="text-xs text-muted-foreground">{c.hqLocation}</div>
                                        <div className="flex flex-wrap gap-1">
                                            {c.subcategories && <Badge variant="secondary" className="text-[10px]">{c.subcategories}</Badge>}
                                            {c.latestFundingRound && <Badge variant="outline" className="text-[10px]">{c.latestFundingRound}</Badge>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                            <div><span className="text-muted-foreground">Headcount:</span> {c.headcount || "\u2014"}</div>
                                            <div><span className="text-muted-foreground">Funding:</span> {formatCurrency(c.totalFunding || 0)}</div>
                                            <div><span className="text-muted-foreground">Revenue:</span> {formatCurrency(c.estimatedRevenue || 0)}</div>
                                            <div><span className="text-muted-foreground">Moat:</span> {c.weightedScore?.toFixed(0) || "\u2014"}</div>
                                        </div>
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        ))}
                    </div>
                </WidgetCard>
            )}

            {show("network") && (
                <WidgetCard title="Ecosystem Network" subtitle={`${data.length} companies`}>
                    <NetworkGraph data={data} className="min-h-[500px]" />
                </WidgetCard>
            )}

            {hasThesis && filtered.length > 0 && (
                <>
                    {show("landscape") && (
                        <WidgetCard title="Competitive Landscape" subtitle={`${filtered.length} competitors`}>
                            <LandscapeChart data={filtered} className="min-h-[500px]" />
                        </WidgetCard>
                    )}
                    {show("periodic-table") && (
                        <WidgetCard title="Periodic Table" subtitle={`${filtered.length} competitors`}>
                            <PeriodicTable data={filtered} compact={true} />
                        </WidgetCard>
                    )}
                    {show("quadrant") && (
                        <WidgetCard title="Competitive Quadrant" subtitle="Market momentum vs execution">
                            <QuadrantChart data={filtered} className="h-[500px]" />
                        </WidgetCard>
                    )}
                    {show("bar") && (
                        <WidgetCard title="Top Rankings" subtitle={`Top from ${filtered.length} competitors`}>
                            <BarChart data={filtered} />
                        </WidgetCard>
                    )}
                </>
            )}

            {isAdmin && <AdminAnalyticsSection data={data} filtered={filtered} enabledWidgets={enabled} />}
        </div>
    );
}
