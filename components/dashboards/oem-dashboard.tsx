"use client";

import { Company } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { useThesis } from "@/contexts/thesis-context";
import { useLayout } from "@/contexts/layout-context";
import { KPICard } from "@/components/widgets/kpi-card";
import { WidgetCard } from "@/components/widgets/widget-card";
import { VizFilterBar } from "@/components/viz-filter-bar";
import { NetworkGraph } from "@/components/charts/network-graph";
import { SunburstChart } from "@/components/charts/sunburst-chart";
import { QuadrantChart } from "@/components/charts/quadrant-chart";
import { PeriodicTable } from "@/components/charts/periodic-table";
import { AdminAnalyticsSection } from "./admin-analytics";
import { Badge } from "@/components/ui/badge";
import { Radar, ShoppingCart, Handshake, AlertCircle } from "lucide-react";
import { useMemo } from "react";

const SCENARIO = "oem_enterprise";

export function OEMDashboard({ data, isLoading, isAdmin = false }: { data: Company[]; isLoading: boolean; isAdmin?: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, scoreCompanies, oemThesis } = useThesis();
    const { getEnabledWidgets } = useLayout();
    const enabled = getEnabledWidgets(SCENARIO);

    const hasThesis = activeThesis === "oem";
    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);

    const replacementCandidates = useMemo(() => scored.filter(r => r.label === "Replacement Candidate"), [scored]);
    const coverageGaps = useMemo(() => scored.filter(r => r.label === "Coverage Gap"), [scored]);

    const displayData = useMemo(() =>
        hasThesis ? scored.filter(r => r.label !== "Filtered Out" && r.label !== "Commercial").map(r => r.company) : []
    , [hasThesis, scored]);
    const filtered = displayData.filter(filterCompany);

    const threats = useMemo(() =>
        hasThesis ? replacementCandidates.filter(r => (r.company.weightedScore || 0) > 60).slice(0, 5) : []
    , [hasThesis, replacementCandidates]);

    const acquisitionTargets = useMemo(() =>
        hasThesis ? coverageGaps.filter(r => ["Pre-Seed", "Seed", "Series A"].includes(r.company.latestFundingRound || "") && (r.company.techDifferentiation || 0) > 3).slice(0, 5) : []
    , [hasThesis, coverageGaps]);

    const gapCount = useMemo(() =>
        hasThesis ? Object.values(oemThesis.coverageMap).filter(v => v === "none").length : 0
    , [hasThesis, oemThesis]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading White Space intelligence...</div>;

    const show = (id: string) => enabled.includes(id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">White Space Intelligence</h1>
                <p className="text-muted-foreground">{hasThesis ? `${displayData.length} relevant companies found.` : "Configure your coverage map to see results."}</p>
            </div>

            {hasThesis && <VizFilterBar companies={displayData} />}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Active Threats" value={hasThesis ? threats.length.toString() : "\u2014"} subtitle={hasThesis ? "High-score replacement targets" : "Set focus to populate"} icon={<Radar className="size-5" />} />
                <KPICard title="Acquisition Targets" value={hasThesis ? acquisitionTargets.length.toString() : "\u2014"} subtitle="Early-stage, high tech diff." icon={<ShoppingCart className="size-5" />} />
                <KPICard title="Capability Gaps" value={hasThesis ? gapCount.toString() : "\u2014"} subtitle="Uncovered subcategories" icon={<AlertCircle className="size-5" />} />
                <KPICard title="Replacement Candidates" value={hasThesis ? replacementCandidates.length.toString() : "\u2014"} subtitle="Customized/homegrown software" icon={<Handshake className="size-5" />} />
            </div>

            {hasThesis && threats.length > 0 && (
                <WidgetCard title="Threat Radar" subtitle="Replacement candidates with highest scores">
                    <div className="space-y-3">
                        {threats.map(({ company: t }) => (
                            <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg border">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">{t.name}</span>
                                        <Badge variant="destructive">Threat</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">{t.subsegment || t.investmentList}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-lg font-bold">{t.weightedScore}</div>
                                    <div className="text-xs text-muted-foreground">Score</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </WidgetCard>
            )}

            {hasThesis && acquisitionTargets.length > 0 && (
                <WidgetCard title="Acquisition Shortlist" subtitle="Early-stage companies filling your gaps">
                    <div className="space-y-3">
                        {acquisitionTargets.map(({ company: t }) => (
                            <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg border">
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium truncate">{t.name}</span>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">{t.latestFundingRound} · Tech: {t.techDifferentiation?.toFixed(1)}/10</p>
                                </div>
                                <Badge variant="outline">{t.investmentList}</Badge>
                            </div>
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
                    {show("sunburst") && (
                        <WidgetCard title="Market Breakdown" subtitle={`${filtered.length} companies`}>
                            <SunburstChart data={filtered} className="min-h-[500px]" />
                        </WidgetCard>
                    )}
                    {show("quadrant") && (
                        <WidgetCard title="Competitive Dynamics" subtitle={`${filtered.length} companies`}>
                            <QuadrantChart data={filtered} className="min-h-[500px]" />
                        </WidgetCard>
                    )}
                    {show("periodic-table") && (
                        <WidgetCard title="Enterprise Recon List" subtitle={`${filtered.length} companies`}>
                            <PeriodicTable data={filtered} compact={true} />
                        </WidgetCard>
                    )}
                </>
            )}

            {isAdmin && <AdminAnalyticsSection data={data} filtered={filtered} enabledWidgets={enabled} />}
        </div>
    );
}
