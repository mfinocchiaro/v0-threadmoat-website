"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { Company, formatCurrency } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { cn, normalizeLogoName } from "@/lib/utils";
import { X, ExternalLink, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

// 12-color palette — first 6 match original investmentList colors
const COLOR_PALETTE = [
    "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4",
    "#ef4444", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#e879f9",
];

function getGroupColor(index: number): string {
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

// ---------- Rich hover card ----------
interface HoverCard {
    company: Company;
    x: number;
    y: number;
}

function CompanyHoverCard({ card, onClose }: { card: HoverCard; onClose: () => void }) {
    const { company, x, y } = card;
    const logoPath = `/logos/${normalizeLogoName(company.name)}/logo_sm.png`;
    const initials = company.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

    // Keep card on screen
    const left = Math.min(x + 12, window.innerWidth - 320);
    const top  = Math.min(y - 8,  window.innerHeight - 440);

    const scores = [
        { label: "Weighted",   value: company.weightedScore,          max: 5 },
        { label: "Market Opp", value: company.marketOpportunity,       max: 5 },
        { label: "Tech Diff",  value: company.techDifferentiation,     max: 5 },
        { label: "Team Exec",  value: company.teamExecution,           max: 5 },
        { label: "Moat",       value: company.competitiveMoat,         max: 5 },
    ];

    return (
        <div
            className="fixed z-[9999] w-72 rounded-xl border border-border bg-card shadow-2xl text-sm"
            style={{ left, top }}
            onMouseEnter={onClose /* keep tooltip alive while hovering — handled by parent logic */}
        >
            {/* Header */}
            <div className="flex items-start gap-2.5 p-3 border-b border-border">
                <div className="w-9 h-9 shrink-0 rounded bg-muted border border-border overflow-hidden flex items-center justify-center">
                    <img
                        src={logoPath}
                        alt={company.name}
                        className="w-full h-full object-contain p-0.5"
                        onError={e => {
                            e.currentTarget.style.display = "none";
                            (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
                        }}
                    />
                    <span className="hidden w-full h-full items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {initials}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    {company.url ? (
                        <a
                            href={company.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-foreground hover:text-primary hover:underline leading-tight flex items-center gap-1 group"
                            onClick={e => e.stopPropagation()}
                        >
                            <span className="truncate">{company.name}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    ) : (
                        <span className="font-semibold text-foreground leading-tight block truncate">{company.name}</span>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{company.hqLocation}</p>
                </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
                <div className="p-2">
                    <p className="text-[10px] text-muted-foreground">Funding</p>
                    <p className="font-semibold text-xs">{formatCurrency(company.totalFunding)}</p>
                </div>
                <div className="p-2">
                    <p className="text-[10px] text-muted-foreground">Headcount</p>
                    <p className="font-semibold text-xs">{company.headcount || "—"}</p>
                </div>
                <div className="p-2">
                    <p className="text-[10px] text-muted-foreground">Founded</p>
                    <p className="font-semibold text-xs">{company.founded || "—"}</p>
                </div>
            </div>

            {/* Score bars */}
            <div className="p-3 space-y-1.5 border-b border-border">
                {scores.map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                        <span className="w-[68px] text-[10px] text-muted-foreground shrink-0">{s.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${((s.value || 0) / s.max) * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-medium w-6 text-right">{(s.value || 0).toFixed(1)}</span>
                    </div>
                ))}
            </div>

            {/* Stage + round */}
            <div className="px-3 py-2 flex flex-wrap gap-1 border-b border-border">
                {company.latestFundingRound && (
                    <Badge variant="secondary" className="text-[10px] h-5">{company.latestFundingRound}</Badge>
                )}
                {company.startupLifecyclePhase && (
                    <Badge variant="outline" className="text-[10px] h-5">{company.startupLifecyclePhase}</Badge>
                )}
                {company.subsegment && (
                    <Badge variant="outline" className="text-[10px] h-5 max-w-[160px] truncate">{company.subsegment}</Badge>
                )}
            </div>

            {/* Strengths snippet */}
            {company.strengths && (
                <div className="px-3 py-2 text-[10px] text-muted-foreground line-clamp-2">
                    <span className="font-medium text-foreground">Strengths: </span>{company.strengths}
                </div>
            )}
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
            color: getGroupColor(idx),
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
                                                    className="relative w-8 h-8 bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:z-50 hover:scale-110 hover:shadow-md hover:border-primary transition-all duration-150 rounded-sm"
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
                                                    <span className="hidden w-full h-full items-center justify-center text-[7px] font-bold text-slate-700 leading-none select-none">
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
                    <CompanyHoverCard card={hoverCard} onClose={hideHover} />
                </div>
            )}
        </div>
    );
}
