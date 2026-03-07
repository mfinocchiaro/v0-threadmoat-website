"use client";

import { Company, formatCurrency } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { useThesis } from "@/contexts/thesis-context";
import { KPICard } from "@/components/widgets/kpi-card";
import { WidgetCard } from "@/components/widgets/widget-card";
import { VizFilterBar } from "@/components/viz-filter-bar";
import { LandscapeChart } from "@/components/charts/landscape-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PeriodicTable } from "@/components/charts/periodic-table";
import { QuadrantChart } from "@/components/charts/quadrant-chart";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Globe, TrendingUp, Users } from "lucide-react";
import { FocusPrompt } from "@/components/dashboard/focus-prompt";
import { useMemo } from "react";

export function StartupDashboard({ data, isLoading }: { data: Company[]; isLoading: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, activeConfig, scoreCompanies } = useThesis();

    const hasThesis = activeThesis === "founder";
    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);
    const matches = useMemo(() => scored.filter(r => r.score >= 50), [scored]);
    const displayData = useMemo(() => hasThesis ? matches.map(r => r.company) : [], [hasThesis, matches]);
    const filtered = displayData.filter(filterCompany);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading ecosystem data…</div>;

    const focusLabel = activeConfig?.buttonText ?? "Set Competitive Moat";

    // No thesis = no data
    if (!hasThesis) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Startup Intelligence</h1>
                    <p className="text-muted-foreground">Monitor market dynamics, competitor movements, and funding trends.</p>
                </div>
                <FocusPrompt label={focusLabel} description="Define your competitive space to reveal competitors, benchmark your positioning, and uncover market gaps." />
            </div>
        );
    }

    const totalFunding = filtered.reduce((s, c) => s + (c.totalFunding || 0), 0);
    const avgCompetitorScore = matches.length > 0
        ? (matches.reduce((s, r) => s + (r.company.weightedScore || 0), 0) / matches.length).toFixed(1)
        : "0";
    const totalHeadcount = filtered.reduce((s, c) => s + (c.headcount || 0), 0);
    const countries = new Set(filtered.map(c => c.country).filter(Boolean)).size;

    const topCompetitors = matches.slice(0, 5);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Startup Intelligence</h1>
                <p className="text-muted-foreground">{matches.length} competitors from {data.length} companies.</p>
            </div>

            <VizFilterBar companies={displayData} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard title="Competitors Found" value={matches.length.toString()} subtitle={`from ${data.length} companies`} trend="up" icon={<DollarSign className="size-4" />} />
                <KPICard title="Avg. Competitor Score" value={avgCompetitorScore} subtitle="Weighted moat score" icon={<TrendingUp className="size-4" />} />
                <KPICard title="Total Headcount" value={totalHeadcount.toLocaleString()} subtitle="Competitor talent pool" trend="stable" icon={<Users className="size-4" />} />
                <KPICard title="Market Reach" value={String(countries)} subtitle="Countries active" icon={<Globe className="size-4" />} />
            </div>

            {topCompetitors.length > 0 && (
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
                                            <div><span className="text-muted-foreground">Headcount:</span> {c.headcount || "—"}</div>
                                            <div><span className="text-muted-foreground">Funding:</span> {formatCurrency(c.totalFunding || 0)}</div>
                                            <div><span className="text-muted-foreground">Revenue:</span> {formatCurrency(c.estimatedRevenue || 0)}</div>
                                            <div><span className="text-muted-foreground">Moat:</span> {c.weightedScore?.toFixed(0) || "—"}</div>
                                        </div>
                                        {c.strengths && <p className="text-xs line-clamp-2"><span className="text-muted-foreground">Strengths:</span> {c.strengths}</p>}
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        ))}
                    </div>
                </WidgetCard>
            )}

            <div className="grid gap-6 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <WidgetCard title="Competitive Landscape" subtitle={`${filtered.length} competitors`} href="/dashboard/landscape">
                        <LandscapeChart data={filtered} className="min-h-[500px]" />
                    </WidgetCard>
                </div>
                <div className="lg:col-span-3">
                    <WidgetCard title="Periodic Table" subtitle={`${filtered.length} competitors`} href="/dashboard/periodic-table">
                        <PeriodicTable data={filtered} compact={true} />
                    </WidgetCard>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <WidgetCard title="Competitive Quadrant" subtitle="Market momentum vs execution" href="/dashboard/quadrant">
                    <QuadrantChart data={filtered} className="h-[400px]" />
                </WidgetCard>
                <WidgetCard title="Top Rankings" subtitle={`Top from ${filtered.length} competitors`} href="/dashboard/bar-chart">
                    <BarChart data={filtered} />
                </WidgetCard>
            </div>
        </div>
    );
}
