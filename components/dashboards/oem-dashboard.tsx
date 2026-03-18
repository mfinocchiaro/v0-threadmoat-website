"use client";

import { Company } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { useThesis } from "@/contexts/thesis-context";
import { useLayout } from "@/contexts/layout-context";
import { KPICard } from "@/components/widgets/kpi-card";
import { WidgetCard } from "@/components/widgets/widget-card";
import { VizFilterBar } from "@/components/viz-filter-bar";
import { NetworkGraphToggle } from "@/components/charts/network-graph-toggle";
import { SunburstChart } from "@/components/charts/sunburst-chart";
import { QuadrantChart } from "@/components/charts/quadrant-chart";
import { PeriodicTable } from "@/components/charts/periodic-table";
import { AdminAnalyticsSection } from "./admin-analytics";
import { Badge } from "@/components/ui/badge";
import { Radar, ShoppingCart, Handshake, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { ScoredCompany } from "@/contexts/thesis-context";

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
        hasThesis ? replacementCandidates.filter(r => (r.company.weightedScore || 0) > 35).slice(0, 10) : []
    , [hasThesis, replacementCandidates]);

    const acquisitionTargets = useMemo(() =>
        hasThesis ? coverageGaps
            .filter(r => (r.company.techDifferentiation || 0) > 2.5)
            .sort((a, b) => (b.company.techDifferentiation || 0) - (a.company.techDifferentiation || 0))
            .slice(0, 10) : []
    , [hasThesis, coverageGaps]);

    // Count gaps = subcategories not covered (explicit "none" + all subcategories NOT in coverageMap)
    const gapCount = useMemo(() => {
        if (!hasThesis) return 0
        const allSubcats = new Set<string>()
        data.forEach(c => { if (c.subcategories) allSubcats.add(c.subcategories) })
        let gaps = 0
        for (const sub of allSubcats) {
            const coverage = oemThesis.coverageMap[sub]
            if (coverage === undefined || coverage === "none") gaps++
        }
        return gaps
    }, [hasThesis, oemThesis, data]);

    type OEMDrillCategory = "threats" | "acquisitions" | "replacements" | null;
    const [drillDown, setDrillDown] = useState<OEMDrillCategory>(null);

    const drillData = useMemo((): ScoredCompany[] => {
        switch (drillDown) {
            case "threats": return threats;
            case "acquisitions": return acquisitionTargets;
            case "replacements": return replacementCandidates;
            default: return [];
        }
    }, [drillDown, threats, acquisitionTargets, replacementCandidates]);

    const drillTitle: Record<string, string> = {
        threats: "Active Threats",
        acquisitions: "Acquisition Targets",
        replacements: "Replacement Candidates",
    };

    const toggleDrill = (cat: OEMDrillCategory) => setDrillDown(prev => prev === cat ? null : cat);

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
                <KPICard title="Active Threats" value={hasThesis ? threats.length.toString() : "\u2014"} subtitle={hasThesis ? "High-score replacement targets" : "Set focus to populate"} icon={<Radar className="size-5" />} onClick={hasThesis && threats.length > 0 ? () => toggleDrill("threats") : undefined} active={drillDown === "threats"} />
                <KPICard title="Acquisition Targets" value={hasThesis ? acquisitionTargets.length.toString() : "\u2014"} subtitle="Early-stage, high tech diff." icon={<ShoppingCart className="size-5" />} onClick={hasThesis && acquisitionTargets.length > 0 ? () => toggleDrill("acquisitions") : undefined} active={drillDown === "acquisitions"} />
                <KPICard title="Capability Gaps" value={hasThesis ? gapCount.toString() : "\u2014"} subtitle="Uncovered subcategories" icon={<AlertCircle className="size-5" />} />
                <KPICard title="Replacement Candidates" value={hasThesis ? replacementCandidates.length.toString() : "\u2014"} subtitle="Customized/homegrown software" icon={<Handshake className="size-5" />} onClick={hasThesis && replacementCandidates.length > 0 ? () => toggleDrill("replacements") : undefined} active={drillDown === "replacements"} />
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

            {hasThesis && threats.length > 0 && (
                <WidgetCard title="Threat Radar" subtitle="Replacement candidates with highest scores">
                    <div className="space-y-3">
                        {threats.map(({ company: t }) => {
                            const words = t.name.split(/\s+/).filter(Boolean);
                            const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : t.name.substring(0, 2).toUpperCase();
                            return (
                            <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg border" title={t.name}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">{initials}</span>
                                        <Badge variant="destructive">Threat</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">{t.subsegment || t.investmentList}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-lg font-bold">{t.weightedScore}</div>
                                    <div className="text-xs text-muted-foreground">Score</div>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                </WidgetCard>
            )}

            {hasThesis && acquisitionTargets.length > 0 && (
                <WidgetCard title="Acquisition Shortlist" subtitle="High tech-differentiation companies filling your gaps">
                    <div className="space-y-3">
                        {acquisitionTargets.map(({ company: t }) => {
                            const words = t.name.split(/\s+/).filter(Boolean);
                            const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : t.name.substring(0, 2).toUpperCase();
                            return (
                            <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg border" title={t.name}>
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium truncate">{initials}</span>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">{t.latestFundingRound} · Tech: {t.techDifferentiation?.toFixed(1)}/10</p>
                                </div>
                                <Badge variant="outline">{t.investmentList}</Badge>
                            </div>
                        );
                        })}
                    </div>
                </WidgetCard>
            )}

            {show("network") && (
                <WidgetCard title="Ecosystem Network" subtitle={`${data.length} companies`}>
                    <NetworkGraphToggle data={data} className="min-h-[500px]" />
                </WidgetCard>
            )}

            {hasThesis && filtered.length > 0 && show("sunburst") && (
                <WidgetCard title="Market Breakdown" subtitle={`${filtered.length} companies`}>
                    <SunburstChart data={filtered} className="min-h-[500px]" />
                </WidgetCard>
            )}
            {hasThesis && filtered.length > 0 && show("quadrant") && (
                <WidgetCard title="Competitive Dynamics" subtitle={`${filtered.length} companies`}>
                    <QuadrantChart data={filtered} className="min-h-[500px]" />
                </WidgetCard>
            )}
            {hasThesis && filtered.length > 0 && show("periodic-table") && (
                <WidgetCard title="Enterprise Recon List" subtitle={`${filtered.length} companies`}>
                    <PeriodicTable data={filtered} compact={true} />
                </WidgetCard>
            )}

            {isAdmin && <AdminAnalyticsSection data={data} filtered={filtered} enabledWidgets={enabled} />}
        </div>
    );
}
