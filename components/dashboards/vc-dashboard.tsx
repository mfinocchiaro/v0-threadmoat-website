"use client";

import dynamic from "next/dynamic";
import { Company, formatCurrency } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { useThesis } from "@/contexts/thesis-context";
import { useLayout } from "@/contexts/layout-context";
import { KPICard } from "@/components/widgets/kpi-card";
import { WidgetCard } from "@/components/widgets/widget-card";
import { VizFilterBar } from "@/components/viz-filter-bar";
import { BubbleChart } from "@/components/charts/bubble-chart";
import { QuadrantChart } from "@/components/charts/quadrant-chart";
import { PeriodicTable } from "@/components/charts/periodic-table";
import { NetworkGraphToggle } from "@/components/charts/network-graph-toggle";
import { AdminAnalyticsSection } from "./admin-analytics";
import { AlertTriangle, BarChart3, Target, CheckCircle2, DollarSign } from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const MapChart = dynamic(() => import("@/components/charts/map-chart").then(m => m.MapChart), {
    ssr: false,
    loading: () => <Skeleton className="w-full min-h-[500px] rounded-lg" />,
});

function CompanyDetail({ company: c, score }: { company: Company; score?: number }) {
    return (
        <div className="space-y-2">
            <div>
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.hqLocation}</div>
            </div>
            <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">{c.investmentList}</Badge>
                {c.subsegment && <Badge variant="secondary" className="text-[10px]">{c.subsegment}</Badge>}
                {c.latestFundingRound && <Badge variant="secondary" className="text-[10px]">{c.latestFundingRound}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {score != null && <div><span className="text-muted-foreground">Match:</span> <span className="font-medium">{score}%</span></div>}
                <div><span className="text-muted-foreground">Founded:</span> {c.founded || "\u2014"}</div>
                <div><span className="text-muted-foreground">Headcount:</span> {c.headcount || "\u2014"}</div>
                <div><span className="text-muted-foreground">Funding:</span> {formatCurrency(c.totalFunding || 0)}</div>
                <div><span className="text-muted-foreground">Revenue:</span> {formatCurrency(c.estimatedRevenue || 0)}</div>
                <div><span className="text-muted-foreground">Moat:</span> {c.weightedScore?.toFixed(0) || "\u2014"}</div>
            </div>
        </div>
    );
}

const SCENARIO = "vc_investor";

export function VCDashboard({ data, isLoading, isAdmin = false }: { data: Company[]; isLoading: boolean; isAdmin?: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, scoreCompanies } = useThesis();
    const { getEnabledWidgets } = useLayout();
    const enabled = getEnabledWidgets(SCENARIO);

    const hasThesis = activeThesis === "vc" || activeThesis === "founder";
    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);
    const matches = useMemo(() => scored.filter(r => r.score >= 50), [scored]);
    const displayData = useMemo(() => hasThesis ? matches.map(r => r.company) : [], [hasThesis, matches]);
    const filtered = displayData.filter(filterCompany);

    const redFlags = useMemo(() =>
        matches.filter(r => (r.company.fundingEfficiency || 0) < 3 && (r.company.totalFunding || 0) > 1_000_000).slice(0, 5)
    , [matches]);

    const totalFunding = useMemo(() => filtered.reduce((s, c) => s + (c.totalFunding || 0), 0), [filtered]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading portfolio data...</div>;

    const matchAvgScore = matches.length > 0
        ? (matches.reduce((s, r) => s + r.score, 0) / matches.length).toFixed(0)
        : "0";

    const show = (id: string) => enabled.includes(id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Investor Intelligence</h1>
                <p className="text-muted-foreground">{hasThesis ? `${matches.length} thesis matches found.` : "Configure your investment thesis to see results."}</p>
            </div>

            {hasThesis && <VizFilterBar companies={displayData} />}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KPICard title="Thesis Matches" value={hasThesis ? matches.length.toString() : "\u2014"} subtitle={hasThesis ? `from ${data.length} total` : "Set focus to populate"} icon={<Target className="size-4" />} />
                <KPICard title="Avg. Match Score" value={hasThesis ? `${matchAvgScore}%` : "\u2014"} subtitle="Across thesis matches" icon={<BarChart3 className="size-4" />} />
                <KPICard title="Total Known Funding" value={hasThesis ? formatCurrency(totalFunding) : "\u2014"} subtitle={hasThesis ? `across ${filtered.length} matches` : "Set focus to populate"} icon={<DollarSign className="size-4" />} />
            </div>

            {hasThesis && redFlags.length > 0 && (
                <WidgetCard title="Burn Warnings" subtitle="Low funding efficiency matches">
                    <div className="space-y-3">
                        {redFlags.map(r => (
                            <HoverCard key={r.company.id} openDelay={200} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                    <div className="flex items-start gap-3 p-2 bg-red-50/10 border border-red-200/20 rounded cursor-default">
                                        <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold truncate">{r.company.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Efficiency: {r.company.fundingEfficiency?.toFixed(1)}/10 · {formatCurrency(r.company.totalFunding || 0)}
                                            </div>
                                        </div>
                                    </div>
                                </HoverCardTrigger>
                                <HoverCardContent side="left" className="w-80">
                                    <CompanyDetail company={r.company} score={r.score} />
                                </HoverCardContent>
                            </HoverCard>
                        ))}
                    </div>
                </WidgetCard>
            )}

            {hasThesis && redFlags.length === 0 && matches.length > 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-emerald-200/30 bg-emerald-50/5 p-6 text-center">
                    <CheckCircle2 className="size-5 text-emerald-500" />
                    <p className="text-sm font-medium">No burn warnings</p>
                    <p className="text-xs text-muted-foreground">All {matches.length} matches have healthy efficiency.</p>
                </div>
            )}

            {show("network") && (
                <WidgetCard title="Ecosystem Network" subtitle={`${data.length} companies`}>
                    <NetworkGraphToggle data={data} className="min-h-[500px]" />
                </WidgetCard>
            )}

            {hasThesis && filtered.length > 0 && (
                <>
                    {show("map") && (
                        <WidgetCard title="Global Deal Flow" subtitle={`${filtered.length} companies`}>
                            <MapChart data={filtered} className="min-h-[500px]" />
                        </WidgetCard>
                    )}
                    {show("bubble") && (
                        <WidgetCard title="Funding Distribution" subtitle={`${filtered.length} thesis matches`}>
                            <BubbleChart data={filtered} className="h-[500px]" />
                        </WidgetCard>
                    )}
                    {show("quadrant") && (
                        <WidgetCard title="Competitive Positioning" subtitle={`${filtered.length} thesis matches`}>
                            <QuadrantChart data={filtered} className="h-[500px]" />
                        </WidgetCard>
                    )}
                    {show("periodic-table") && (
                        <WidgetCard title="Intelligence Master List" subtitle={`${filtered.length} thesis matches`}>
                            <PeriodicTable data={filtered} compact={true} />
                        </WidgetCard>
                    )}
                </>
            )}

            {isAdmin && <AdminAnalyticsSection data={data} filtered={filtered} enabledWidgets={enabled} />}
        </div>
    );
}
