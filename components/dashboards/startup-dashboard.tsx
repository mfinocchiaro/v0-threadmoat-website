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
import { DollarSign, Globe, TrendingUp, Users } from "lucide-react";
import { FocusPrompt } from "@/components/dashboard/focus-prompt";
import { useMemo } from "react";

export function StartupDashboard({ data, isLoading }: { data: Company[]; isLoading: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, scoreCompanies } = useThesis();
    const filtered = data.filter(filterCompany);

    const hasThesis = activeThesis === "founder";
    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);
    const matches = useMemo(() => scored.filter(r => r.score >= 50), [scored]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading ecosystem data…</div>;

    const totalFunding = filtered.reduce((s, c) => s + (c.totalFunding || 0), 0);
    const avgFunding = filtered.length > 0 ? totalFunding / filtered.length : 0;
    const totalHeadcount = filtered.reduce((s, c) => s + (c.headcount || 0), 0);
    const countries = new Set(filtered.map(c => c.country).filter(Boolean)).size;

    // Thesis-driven insights
    const topCompetitors = useMemo(() =>
        hasThesis ? matches.slice(0, 3) : []
    , [hasThesis, matches]);

    const avgCompetitorScore = matches.length > 0
        ? (matches.reduce((s, r) => s + (r.company.weightedScore || 0), 0) / matches.length).toFixed(1)
        : "0";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Startup Intelligence</h1>
                <p className="text-muted-foreground">Monitor market dynamics, competitor movements, and funding trends.</p>
            </div>

            <VizFilterBar companies={data} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title={hasThesis ? "Competitors Found" : "Total Ecosystem Funding"}
                    value={hasThesis ? matches.length.toString() : formatCurrency(totalFunding)}
                    subtitle={hasThesis ? `from ${data.length} companies` : `${filtered.length} companies`}
                    trend="up"
                    icon={<DollarSign className="size-4" />}
                />
                <KPICard
                    title={hasThesis ? "Avg. Competitor Score" : "Avg. Round Size"}
                    value={hasThesis ? avgCompetitorScore : formatCurrency(avgFunding)}
                    subtitle={hasThesis ? "Weighted moat score" : "Series A–C focus"}
                    icon={<TrendingUp className="size-4" />}
                />
                <KPICard title="Total Headcount" value={totalHeadcount.toLocaleString()} subtitle="Talent pool" trend="stable" icon={<Users className="size-4" />} />
                <KPICard title="Market Reach" value={String(countries)} subtitle="Countries active" icon={<Globe className="size-4" />} />
            </div>

            {!hasThesis && (
                <FocusPrompt label="Set Competitive Moat" description="Identify your top competitors, benchmark your positioning, and uncover market gaps." />
            )}

            <div className="grid gap-6 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <WidgetCard title="Market Landscape" subtitle="Grouped by Investment List & Subsegment" href="/dashboard/landscape">
                        <LandscapeChart data={data} className="min-h-[500px]" />
                    </WidgetCard>
                </div>
                <div className="lg:col-span-3">
                    <WidgetCard title="Periodic Table" subtitle="Quick-look metrics and groups" href="/dashboard/periodic-table">
                        <PeriodicTable data={filtered} compact={true} />
                    </WidgetCard>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <WidgetCard title="Competitive Quadrant" subtitle="Market momentum vs execution" href="/dashboard/quadrant">
                    <QuadrantChart data={filtered} className="h-[400px]" />
                </WidgetCard>
                <WidgetCard title="Top Rankings" subtitle="Score or funding distribution" href="/dashboard/bar-chart">
                    <BarChart data={data} />
                </WidgetCard>
            </div>

            {hasThesis && topCompetitors.length > 0 && (
                <WidgetCard title="Top Competitors" subtitle="Highest-scoring companies matching your moat criteria">
                    <div className="space-y-4">
                        {topCompetitors.map(({ company: c, score }) => (
                            <div key={c.id} className="bg-muted p-4 rounded-lg border-l-4 border-amber-500">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold">{c.name}</h4>
                                    <span className="text-sm font-medium">{score}% match</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {c.investmentList} · {c.country} · Score: {c.weightedScore} · {formatCurrency(c.totalFunding || 0)} raised
                                </p>
                            </div>
                        ))}
                    </div>
                </WidgetCard>
            )}

        </div>
    );
}
