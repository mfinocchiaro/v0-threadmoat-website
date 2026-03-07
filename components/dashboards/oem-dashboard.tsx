"use client";

import { Company } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { useThesis } from "@/contexts/thesis-context";
import { KPICard } from "@/components/widgets/kpi-card";
import { WidgetCard } from "@/components/widgets/widget-card";
import { VizFilterBar } from "@/components/viz-filter-bar";
import { NetworkGraph } from "@/components/charts/network-graph";
import { SunburstChart } from "@/components/charts/sunburst-chart";
import { QuadrantChart } from "@/components/charts/quadrant-chart";
import { PeriodicTable } from "@/components/charts/periodic-table";
import { Badge } from "@/components/ui/badge";
import { Radar, ShoppingCart, Handshake, AlertCircle } from "lucide-react";
import { FocusPrompt } from "@/components/dashboard/focus-prompt";
import { useMemo } from "react";

export function OEMDashboard({ data, isLoading }: { data: Company[]; isLoading: boolean }) {
    const { filterCompany } = useFilter();
    const { activeThesis, activeConfig, scoreCompanies, oemThesis } = useThesis();

    const hasThesis = activeThesis === "oem";
    const scored = useMemo(() => scoreCompanies(data), [scoreCompanies, data]);

    const replacementCandidates = useMemo(() => scored.filter(r => r.label === "Replacement Candidate"), [scored]);
    const coverageGaps = useMemo(() => scored.filter(r => r.label === "Coverage Gap"), [scored]);

    // Display data = everything except "Filtered Out" and "Commercial"
    const displayData = useMemo(() =>
        hasThesis
            ? scored.filter(r => r.label !== "Filtered Out" && r.label !== "Commercial").map(r => r.company)
            : data
    , [hasThesis, scored, data]);
    const filtered = displayData.filter(filterCompany);

    // Threats: replacement candidates with high weighted scores
    const threats = useMemo(() =>
        hasThesis
            ? replacementCandidates.filter(r => (r.company.weightedScore || 0) > 60).slice(0, 5)
            : []
    , [hasThesis, replacementCandidates]);

    // Acquisition targets: coverage gap companies that are early-stage with strong tech
    const acquisitionTargets = useMemo(() =>
        hasThesis
            ? coverageGaps
                .filter(r => ["Pre-Seed", "Seed", "Series A"].includes(r.company.latestFundingRound || "") && (r.company.techDifferentiation || 0) > 3)
                .slice(0, 5)
            : []
    , [hasThesis, coverageGaps]);

    // Capability gaps: subcategories marked "none" in coverage map
    const gapCount = useMemo(() =>
        hasThesis ? Object.values(oemThesis.coverageMap).filter(v => v === "none").length : 0
    , [hasThesis, oemThesis]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading OEM intelligence…</div>;

    const focusLabel = activeConfig?.buttonText ?? "Set Coverage Analysis";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">OEM Intelligence</h1>
                <p className="text-muted-foreground">{hasThesis ? `${displayData.length} relevant companies from ${data.length} total.` : `${data.length} companies across all domains.`}</p>
            </div>

            {!hasThesis && <FocusPrompt label={focusLabel} description="Map your software landscape to reveal threats, acquisition targets, and capability gaps." />}

            {hasThesis && <VizFilterBar companies={displayData} />}

            {hasThesis && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    title="Active Threats"
                    value={threats.length.toString()}
                    subtitle="High-score replacement targets"
                    trend={threats.length > 0 ? "up" : undefined}
                    icon={<Radar className="size-5" />}
                />
                <KPICard
                    title="Acquisition Targets"
                    value={acquisitionTargets.length.toString()}
                    subtitle="Early-stage, high tech diff."
                    icon={<ShoppingCart className="size-5" />}
                />
                <KPICard
                    title="Capability Gaps"
                    value={gapCount.toString()}
                    subtitle="Uncovered subcategories"
                    trend={gapCount > 0 ? "down" : undefined}
                    icon={<AlertCircle className="size-5" />}
                />
                <KPICard
                    title="Replacement Candidates"
                    value={replacementCandidates.length.toString()}
                    subtitle="Customized/homegrown software"
                    icon={<Handshake className="size-5" />}
                />
            </div>}

            {hasThesis && threats.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
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
                    {acquisitionTargets.length > 0 && (
                        <WidgetCard title="Acquisition Shortlist" subtitle="Early-stage companies filling your gaps">
                            <div className="space-y-3">
                                {acquisitionTargets.map(({ company: t }) => (
                                    <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg border">
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium truncate">{t.name}</span>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                {t.latestFundingRound} · Tech: {t.techDifferentiation?.toFixed(1)}/10
                                            </p>
                                        </div>
                                        <Badge variant="outline">{t.investmentList}</Badge>
                                    </div>
                                ))}
                            </div>
                        </WidgetCard>
                    )}
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                <WidgetCard title="Ecosystem Network" subtitle={`${filtered.length} companies`} className="md:col-span-1" href="/dashboard/network">
                    <NetworkGraph data={filtered} className="min-h-[400px]" />
                </WidgetCard>
                <WidgetCard title="Market Breakdown" subtitle={`${filtered.length} companies`} className="md:col-span-1" href="/dashboard/sunburst">
                    <SunburstChart data={filtered} className="min-h-[400px]" />
                </WidgetCard>
                <WidgetCard title="Competitive Dynamics" subtitle={`${filtered.length} companies`} className="md:col-span-1" href="/dashboard/quadrant">
                    <QuadrantChart data={filtered} className="min-h-[400px]" />
                </WidgetCard>
            </div>

            <WidgetCard title="Enterprise Recon List" subtitle={`${filtered.length} companies`} href="/dashboard/periodic-table">
                <PeriodicTable data={filtered} compact={true} />
            </WidgetCard>
        </div>
    );
}
