"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { Company, formatCurrency } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { cn, normalizeLogoName } from "@/lib/utils";
import { getInvestmentColor } from "@/lib/investment-colors";
import { X, ExternalLink, ArrowLeft } from "lucide-react";
import { CompanyHoverCard } from "@/components/ui/company-hover-card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface LandscapeChartProps {
    data: Company[];
    className?: string;
}

// ---------- Grouping configuration ----------

type GroupableField =
    | "investmentList"
    | "manufacturingType"
    | "country"
    | "discipline"
    | "lifecyclePhase"
    | "workflowSegment"
    | "latestFundingRound";

const GROUPABLE_FIELDS: Record<GroupableField, { label: string; accessor: (c: Company) => string }> = {
    investmentList:     { label: "Investment List",    accessor: c => c.investmentList || "Other" },
    manufacturingType:  { label: "Manufacturing Type", accessor: c => c.manufacturingType || "Unknown" },
    country:            { label: "Country",            accessor: c => c.country || "Unknown" },
    discipline:         { label: "Discipline",         accessor: c => c.discipline || "Unknown" },
    lifecyclePhase:     { label: "Lifecycle Phase",    accessor: c => c.lifecyclePhase || c.startupLifecyclePhase || "Unknown" },
    workflowSegment:    { label: "Workflow Segment",   accessor: c => c.workflowSegment || "Unknown" },
    latestFundingRound: { label: "Funding Round",      accessor: c => c.latestFundingRound || "Unknown" },
};

type ThenByField = GroupableField | "subsegment";

const THEN_BY_FIELDS: Record<ThenByField, { label: string; accessor: (c: Company) => string }> = {
    ...GROUPABLE_FIELDS,
    subsegment: { label: "Subsegment", accessor: c => c.subsegment || "Uncategorized" },
};

// Fallback palette for non-investmentList groupings (country, discipline, etc.)
const FALLBACK_PALETTE = [
    "#2E6DB4", "#8FB3E8", "#2BBFB3", "#D45500", "#F4B400", "#F2B38B",
    "#D642A6", "#7EC8E3", "#0B7A20", "#7A3FD1", "#7C3AED", "#64748b",
];

function getGroupColor(groupName: string, index: number, groupBy: string): string {
    // When grouped by Investment List, use the canonical Airtable colors
    if (groupBy === "investmentList") {
        return getInvestmentColor(groupName);
    }
    return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

// ---------- Hover card positioning wrapper ----------
interface HoverCard {
    company: Company;
    x: number;
    y: number;
}

function HoverCardPositioned({ card, onClose }: { card: HoverCard; onClose: () => void }) {
    const { company, x, y } = card;
    const left = Math.min(x + 12, window.innerWidth - 320);
    const top  = Math.min(y - 8,  window.innerHeight - 480);
    return (
        <div className="fixed z-[9999]" style={{ left, top }}>
            <CompanyHoverCard company={company} onClose={onClose} />
        </div>
    );
}

// ---------- Subsegment drill-down view ----------
interface SubsegmentDrillProps {
    title: string;
    color: string;
    subcategories: Array<{ title: string; companies: Company[] }>;
    onBack: () => void;
    drillDetail: "funding" | "subsegment";
    onToggleDrillDetail: () => void;
}

function SubsegmentDrill({ title, color, subcategories, onBack, drillDetail, onToggleDrillDetail }: SubsegmentDrillProps) {
    // Bin-pack subcategories into 3 columns: largest-first, always add to shortest column
    const columns = useMemo(() => {
        const cols = [
            { items: [] as typeof subcategories, height: 0 },
            { items: [] as typeof subcategories, height: 0 },
            { items: [] as typeof subcategories, height: 0 },
        ];
        const sorted = [...subcategories].sort((a, b) => b.companies.length - a.companies.length);
        for (const sub of sorted) {
            const weight = 40 + sub.companies.length * 36;
            const shortest = cols.reduce((min, col) => (col.height < min.height ? col : min), cols[0]);
            shortest.items.push(sub);
            shortest.height += weight + 12;
        }
        return cols.map(c => c.items);
    }, [subcategories]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Landscape
                </button>
                <div
                    className="flex-1 px-3 py-1.5 rounded-md text-white text-sm font-bold uppercase tracking-wide"
                    style={{ backgroundColor: color }}
                >
                    {title.replace(/^\d+-/, "")}
                </div>
                <button
                    onClick={onToggleDrillDetail}
                    className="text-xs px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted transition-colors text-muted-foreground"
                >
                    Show: {drillDetail === "funding" ? "Funding" : "Subsegment"}
                </button>
                <span className="text-sm text-muted-foreground">
                    {subcategories.reduce((n, s) => n + s.companies.length, 0)} companies
                </span>
            </div>

            {/* 3-column bin-packed layout — uniform card width sized to widest content */}
            <div className="inline-flex gap-3 items-start">
                {columns.map((colItems, colIdx) => (
                    <div key={colIdx} className="flex flex-col gap-3">
                        {colItems.map(sub => (
                            <div key={sub.title} className="rounded-lg border border-border bg-card overflow-hidden">
                                <div className="px-3 py-2 bg-muted/40 border-b border-border">
                                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap" title={sub.title}>
                                        {sub.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">{sub.companies.length} companies</p>
                                </div>
                                <div className="divide-y divide-border">
                                    {sub.companies.map(c => {
                                        const logoPath = `/logos/${normalizeLogoName(c.name)}/logo_sm.png`;
                                        const initials = c.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
                                        return (
                                            <div key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
                                                <div className="w-6 h-6 shrink-0 rounded bg-muted border border-border overflow-hidden flex items-center justify-center">
                                                    <img
                                                        src={logoPath}
                                                        alt={c.name}
                                                        className="w-full h-full object-contain p-px"
                                                        onError={e => {
                                                            e.currentTarget.style.display = "none";
                                                            (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
                                                        }}
                                                    />
                                                    <span className="hidden w-full h-full items-center justify-center text-[8px] font-bold text-muted-foreground">
                                                        {initials}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {c.url ? (
                                                        <a
                                                            href={c.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-medium hover:text-primary hover:underline whitespace-nowrap flex items-center gap-1 group"
                                                        >
                                                            {c.name}
                                                            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-60" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs font-medium whitespace-nowrap">{c.name}</span>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground select-text cursor-text">
                                                        {drillDetail === "funding"
                                                            ? formatCurrency(c.totalFunding)
                                                            : (c.subsegment || "—")}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                                                    {(c.weightedScore || 0).toFixed(1)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---------- Main component ----------
export function LandscapeChart({ data, className }: LandscapeChartProps) {
    const { filterCompany } = useFilter();
    const [hoverCard, setHoverCard] = useState<HoverCard | null>(null);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [drillTarget, setDrillTarget] = useState<string | null>(null);

    // Grouping state
    const [groupBy, setGroupBy] = useState<GroupableField>("investmentList");
    const [thenBy, setThenBy] = useState<ThenByField>("subsegment");
    const [drillDetail, setDrillDetail] = useState<"funding" | "subsegment">("funding");

    // Reset drill-down when grouping changes
    useEffect(() => {
        setDrillTarget(null);
    }, [groupBy, thenBy]);

    // If thenBy collides with groupBy, reset to subsegment
    useEffect(() => {
        if (thenBy === groupBy) {
            setThenBy("subsegment");
        }
    }, [groupBy, thenBy]);

    const filteredData = useMemo(() => data.filter(filterCompany), [data, filterCompany]);

    const groupedData = useMemo(() => {
        const groupAccessor = GROUPABLE_FIELDS[groupBy].accessor;
        const thenByAccessor = THEN_BY_FIELDS[thenBy].accessor;

        const groups: Record<string, Record<string, Company[]>> = {};
        filteredData.forEach(company => {
            const macro = groupAccessor(company);
            const sub = thenByAccessor(company);
            if (!groups[macro]) groups[macro] = {};
            if (!groups[macro][sub]) groups[macro][sub] = [];
            groups[macro][sub].push(company);
        });
        const sortedMacros = Object.keys(groups).sort();
        return sortedMacros.map((macro, idx) => ({
            title: macro,
            color: getGroupColor(macro, idx, groupBy),
            subcategories: Object.keys(groups[macro]).sort().map(sub => ({
                title: sub,
                companies: groups[macro][sub].sort((a, b) => b.totalFunding - a.totalFunding),
            })),
        }));
    }, [filteredData, groupBy, thenBy]);

    // Drill-down view: always groups by the "Subcategories" CSV column
    const drillGroupedData = useMemo(() => {
        if (!drillTarget) return null;
        const groupAccessor = GROUPABLE_FIELDS[groupBy].accessor;

        const companies = filteredData.filter(c => groupAccessor(c) === drillTarget);
        const groups: Record<string, Company[]> = {};
        companies.forEach(c => {
            const key = c.subcategories || "Uncategorized";
            if (!groups[key]) groups[key] = [];
            groups[key].push(c);
        });
        return Object.keys(groups).sort().map(title => ({
            title,
            companies: groups[title].sort((a, b) => b.totalFunding - a.totalFunding),
        }));
    }, [filteredData, drillTarget, groupBy]);

    const showHover = useCallback((company: Company, e: React.MouseEvent) => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setHoverCard({ company, x: e.clientX, y: e.clientY });
    }, []);

    const hideHover = useCallback(() => {
        hoverTimer.current = setTimeout(() => setHoverCard(null), 120);
    }, []);

    const keepHover = useCallback(() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
    }, []);

    if (filteredData.length === 0) {
        return (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                No companies match your filters.
            </div>
        );
    }

    // Drill-down view
    if (drillTarget && drillGroupedData) {
        const macro = groupedData.find(g => g.title === drillTarget);
        return (
            <SubsegmentDrill
                title={drillTarget}
                color={macro?.color ?? "#64748b"}
                subcategories={drillGroupedData}
                onBack={() => setDrillTarget(null)}
                drillDetail={drillDetail}
                onToggleDrillDetail={() => setDrillDetail(d => d === "funding" ? "subsegment" : "funding")}
            />
        );
    }

    return (
        <div className={cn("landscape-analytics relative", className)}>
            {/* Grouping controls */}
            <div className="flex items-center gap-4 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Group by</span>
                    <Select value={groupBy} onValueChange={v => setGroupBy(v as GroupableField)}>
                        <SelectTrigger size="sm" className="h-7 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(GROUPABLE_FIELDS).map(([key, { label }]) => (
                                <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Then by</span>
                    <Select value={thenBy} onValueChange={v => setThenBy(v as ThenByField)}>
                        <SelectTrigger size="sm" className="h-7 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(THEN_BY_FIELDS)
                                .filter(([key]) => key !== groupBy)
                                .map(([key, { label }]) => (
                                    <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-1 space-y-1">
                {groupedData.map((macro) => (
                    <div
                        key={macro.title}
                        className="break-inside-avoid border border-border bg-card flex flex-col mb-1"
                        style={{ borderColor: macro.color }}
                    >
                        {/* Clickable category header */}
                        <button
                            className="px-1 py-0.5 text-[10px] uppercase font-black tracking-tight text-center border-b border-border truncate text-white hover:brightness-110 active:brightness-90 transition-all text-left w-full flex items-center justify-center gap-1 group"
                            style={{ backgroundColor: macro.color }}
                            onClick={() => setDrillTarget(macro.title)}
                            title={`Drill into ${macro.title.replace(/^\d+-/, "")}`}
                        >
                            {macro.title.replace(/^\d+-/, "")}
                            <span className="opacity-0 group-hover:opacity-70 text-[8px] ml-1 transition-opacity">↗</span>
                        </button>

                        <div className="flex flex-wrap gap-[1px] bg-border p-[1px]">
                            {macro.subcategories.map((sub) => (
                                <div key={sub.title} className="flex-1 min-w-[60px] flex flex-col bg-background">
                                    <div className="bg-muted/30 px-1 py-px text-[8px] font-bold text-muted-foreground text-center uppercase border-b border-muted truncate">
                                        {sub.title}
                                    </div>
                                    <div className="flex flex-wrap gap-px p-px justify-center content-start">
                                        {sub.companies.map((company) => {
                                            const normalizedName = normalizeLogoName(company.name);
                                            const logoPath = `/logos/${normalizedName}/logo_sm.png`;
                                            const initials = company.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
                                            return (
                                                <div
                                                    key={company.id}
                                                    className="relative w-8 h-8 bg-muted border border-border overflow-hidden cursor-pointer hover:z-50 hover:scale-110 hover:shadow-md hover:border-primary transition-all duration-150 rounded-sm"
                                                    onMouseEnter={e => showHover(company, e)}
                                                    onMouseLeave={hideHover}
                                                    onDoubleClick={() => { if (company.url) window.open(company.url, "_blank", "noopener,noreferrer"); }}
                                                >
                                                    <img
                                                        src={logoPath}
                                                        alt={company.name}
                                                        className="w-full h-full object-contain p-0.5"
                                                        onError={e => {
                                                            e.currentTarget.style.display = "none";
                                                            (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
                                                        }}
                                                    />
                                                    <span className="hidden w-full h-full items-center justify-center text-[7px] font-bold text-foreground leading-none select-none">
                                                        {initials}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Hover card (fixed-position, outside column layout) */}
            {hoverCard && (
                <div onMouseEnter={keepHover} onMouseLeave={hideHover}>
                    <HoverCardPositioned card={hoverCard} onClose={hideHover} />
                </div>
            )}
        </div>
    );
}
