"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Company } from "@/lib/company-data";
import { cn, normalizeLogoName } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { CompanyHoverCard } from "@/components/ui/company-hover-card";
import "./periodic-table.css";

interface PeriodicTableProps {
    data: Company[];
    compact?: boolean;
    preview?: boolean;
}

const INVESTMENT_COLORS: Record<string, string> = {
    "01": "#2E6DB4",
    "02": "#8FB3E8",
    "03": "#2BBFB3",
    "04": "#D45500",
    "05": "#F4B400",
    "06": "#F2B38B",
    "07": "#D642A6",
    "08": "#7EC8E3",
    "09": "#0B7A20",
    "10": "#7A3FD1",
    default: "#64748b",
};

const getInvestmentCategoryID = (investmentList: string): string => {
    if (!investmentList) return "default";
    const list = investmentList.toLowerCase();
    if (list.includes("design") || list.includes("cad")) return "01";
    if (list.includes("extreme") || list.includes("cae") || list.includes("cfd") || list.includes("fea")) return "02";
    if (list.includes("adaptive") || list.includes("cam") || list.includes("cnc")) return "03";
    if (list.includes("cognitive") || list.includes("plm") || list.includes("mbse")) return "04";
    if (list.includes("factory") || list.includes("mes") || list.includes("iiot")) return "05";
    if (list.includes("augmented") || list.includes("mom") || list.includes("mro")) return "06";
    if (list.includes("supply chain") || list.includes("scm")) return "07";
    if (list.includes("bim") || list.includes("aec")) return "08";
    if (list.includes("innovation") || list.includes("robotics") || list.includes("drones")) return "09";
    if (list.includes("education")) return "10";
    const prefix = investmentList.substring(0, 2);
    if (INVESTMENT_COLORS[prefix]) return prefix;
    return "default";
};

const getInvestmentColor = (investmentList: string) =>
    INVESTMENT_COLORS[getInvestmentCategoryID(investmentList)];

const getCountryFlag = (country: string) => {
    if (!country) return "—";
    const flagMatch = country.match(/[\u{1F1E0}-\u{1F1FF}]{2}/u);
    if (flagMatch) return flagMatch[0];
    const clean = country.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "").trim().toLowerCase();
    const flags: Record<string, string> = {
        "united states": "🇺🇸", usa: "🇺🇸", us: "🇺🇸",
        "united kingdom": "🇬🇧", uk: "🇬🇧", "great britain": "🇬🇧",
        germany: "🇩🇪", france: "🇫🇷", canada: "🇨🇦", italy: "🇮🇹",
        netherlands: "🇳🇱", spain: "🇪🇸", switzerland: "🇨🇭", sweden: "🇸🇪",
        norway: "🇳🇴", denmark: "🇩🇰", finland: "🇫🇮", belgium: "🇧🇪",
        austria: "🇦🇹", israel: "🇮🇱", china: "🇨🇳", japan: "🇯🇵",
        india: "🇮🇳", estonia: "🇪🇪",
    };
    return flags[clean] || "";
};

const getStarRating = (score: number): string => {
    if (!score) return "—";
    if (score > 4.6) return "★★★★★";
    if (score >= 4.4) return "★★★★";
    if (score >= 4.2) return "★★★";
    if (score >= 4.0) return "★★";
    return "★";
};

const getBroadFunding = (round: string): string => {
    if (!round || round === "—") return "—";
    if (round === "Bootstrapped") return "Bootstr";
    const lower = round.toLowerCase();
    if (lower.includes("seed")) return "Seed";
    if (lower.includes("series a")) return "A";
    if (lower.includes("series b")) return "B";
    if (lower.includes("series c") || lower.includes("series d") || lower.includes("series e") ||
        lower.includes("series f") || lower.includes("series g") || lower.includes("ipo") ||
        lower.includes("acquired")) return "C+";
    return round;
};

export function PeriodicTable({ data, compact = false, preview = false }: PeriodicTableProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [groupBy, setGroupBy] = useState<"investment" | "discipline" | "lifecycle" | "subsegment">("investment");
    const [sortBy, setSortBy] = useState<"score" | "valuation" | "funding" | "headcount" | "name">("score");
    const [colorBy, setColorBy] = useState<"investment" | "country" | "funding-round" | "score">("investment");
    const [elementSize, setElementSize] = useState<"small" | "medium" | "large">("medium");
    const [showLogos, setShowLogos] = useState(false);
    const [showCountry, setShowCountry] = useState(true);
    const [showCompanyNames, setShowCompanyNames] = useState(true);
    const [selectedElement, setSelectedElement] = useState<Company | null>(null);
    const [activeMode, setActiveMode] = useState<"global" | "linkedin" | "custom">(preview ? "linkedin" : "global");
    const [customList, setCustomList] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [pasteText, setPasteText] = useState("");
    const [pasteMode, setPasteMode] = useState<"search" | "paste">("search");
    const [savedViews, setSavedViews] = useState<Record<string, string[]>>({});
    const [viewName, setViewName] = useState("");
    const [globalTilesPerRow, setGlobalTilesPerRow] = useState(10);
    const [customTilesPerRow, setCustomTilesPerRow] = useState(15);

    useEffect(() => {
        const saved = localStorage.getItem("periodic-table-views");
        if (saved) {
            try { setSavedViews(JSON.parse(saved)); } catch { }
        }
    }, []);

    const saveCurrentView = () => {
        if (!viewName.trim()) return;
        const newViews = { ...savedViews, [viewName.trim()]: customList };
        setSavedViews(newViews);
        localStorage.setItem("periodic-table-views", JSON.stringify(newViews));
        setViewName("");
    };

    const loadView = (name: string) => {
        if (savedViews[name]) {
            setCustomList(savedViews[name]);
            setActiveMode("custom");
        }
    };

    const deleteView = (name: string) => {
        const newViews = { ...savedViews };
        delete newViews[name];
        setSavedViews(newViews);
        localStorage.setItem("periodic-table-views", JSON.stringify(newViews));
    };

    useEffect(() => {
        if (!containerRef.current) return;
        d3.select(containerRef.current).selectAll("*").remove();

        if (data.length === 0) {
            d3.select(containerRef.current)
                .append("div")
                .attr("class", "flex flex-col items-center justify-center h-48 text-muted-foreground italic")
                .text("No companies match the current filters.");
            return;
        }

        const effectiveTilesPerRow = activeMode === "custom" ? customTilesPerRow : globalTilesPerRow;
        const displayData = activeMode === "custom" ? data.filter(d => customList.includes(d.name)) : data;

        const grouped = d3.group(displayData, (d: Company) => {
            switch (groupBy) {
                case "investment": return d.investmentList || "Other";
                case "discipline": return d.discipline || "Unknown";
                case "lifecycle": return d.lifecyclePhase || d.startupLifecyclePhase || "Unknown";
                case "subsegment": return d.subsegment || "Unknown";
                default: return d.investmentList || "Other";
            }
        });

        const sortedGroups = Array.from(grouped.entries()).map(([key, values]) => {
            const sorted = [...values].sort((a, b) => {
                switch (sortBy) {
                    case "score": return (b.weightedScore || 0) - (a.weightedScore || 0);
                    case "valuation": return (b.estimatedMarketValue || 0) - (a.estimatedMarketValue || 0);
                    case "funding": return (b.totalFunding || 0) - (a.totalFunding || 0);
                    case "headcount": return (b.headcount || 0) - (a.headcount || 0);
                    case "name": return a.name.localeCompare(b.name);
                    default: return 0;
                }
            });
            const limit = preview ? 8 : activeMode === "custom" ? 999 : 15;
            return { key, values: sorted.slice(0, limit) };
        });

        // Sort groups by canonical investment list order
        if (groupBy === "investment") {
            sortedGroups.sort((a, b) => {
                const idA = getInvestmentCategoryID(a.key);
                const idB = getInvestmentCategoryID(b.key);
                return idA.localeCompare(idB);
            });
        }

        const colorScaleOrdinal = d3.scaleOrdinal(["#2E6DB4","#8FB3E8","#2BBFB3","#D45500","#F4B400","#F2B38B","#D642A6","#7EC8E3","#0B7A20","#7A3FD1"]);

        const mainGrid = d3.select(containerRef.current)
            .append("div")
            .attr("class", effectiveTilesPerRow <= 5 ? "pt-compact-grid" : "pt-grid-container");

        const renderGroups = (groups: typeof sortedGroups, container: d3.Selection<HTMLDivElement, any, any, any>) => {
            groups.forEach((group) => {
                const row = container.append("div").attr("class", "pt-row");
                row.append("div").attr("class", "pt-row-label").text(group.key);

                const elementsContainer = row.append("div")
                    .attr("class", "pt-group-elements")
                    .style("grid-template-columns", `repeat(${effectiveTilesPerRow}, auto)`);

                const displayValues = activeMode === "custom"
                    ? group.values
                    : group.values.slice(0, effectiveTilesPerRow);

                displayValues.forEach((company: Company) => {
                    const categoryID = getInvestmentCategoryID(company.investmentList || "");
                    const isDarkText = ["02", "03", "05", "06", "07"].includes(categoryID);

                    const element = elementsContainer.append("div")
                        .attr("class", `pt-element ${isDarkText ? "pt-contrast-dark" : ""}`)
                        .style("background-color", () => {
                            switch (colorBy) {
                                case "investment": return getInvestmentColor(company.investmentList);
                                case "country": return colorScaleOrdinal(company.country);
                                case "funding-round": return colorScaleOrdinal(company.latestFundingRound || "Unknown");
                                case "score": return d3.interpolateBlues((company.weightedScore || 0) / 100);
                                default: return getInvestmentColor(company.investmentList);
                            }
                        })
                        .on("click", () => { if (!preview) setSelectedElement(company); });

                    if (activeMode !== "linkedin") {
                        element.append("div").attr("class", "pt-score").text(company.weightedScore || "—");
                    } else {
                        element.append("div").attr("class", "pt-stars").text(getStarRating(company.weightedScore || 0));
                    }

                    if (activeMode !== "linkedin") {
                        element.append("div").attr("class", "pt-funding").text(company.headcount || "—");
                    }

                    let roundText = company.latestFundingRound || "—";
                    if (activeMode === "linkedin") roundText = getBroadFunding(roundText);
                    else if (roundText === "Bootstrapped") roundText = "Bootstr";
                    element.append("div").attr("class", "pt-valuation").text(roundText);

                    const middleArea = element.append("div").attr("class", "pt-middle-area");

                    const words = company.name.split(/\s+/).filter((w: string) => w);
                    const symbolText = words.length >= 2
                        ? (words[0][0] + words[1][0]).toUpperCase()
                        : company.name.substring(0, 2).toUpperCase();
                    const symbolDiv = middleArea.append("div").attr("class", "pt-symbol");
                    if (company.url) {
                        symbolDiv.append("a")
                            .attr("href", company.url)
                            .attr("target", "_blank")
                            .attr("rel", "noopener noreferrer")
                            .style("color", "inherit")
                            .style("text-decoration", "none")
                            .style("cursor", "pointer")
                            .text(symbolText);
                    } else {
                        symbolDiv.text(symbolText);
                    }

                    if (showLogos) {
                        const normalizedName = normalizeLogoName(company.name);
                        const logoPath = `/logos/${normalizedName}/logo_sm.png`;
                        const logoContainer = middleArea.append("div").attr("class", "pt-logo-container");
                        logoContainer.append("img")
                            .attr("src", logoPath).attr("alt", company.name).attr("class", "pt-logo")
                            .on("error", function () { d3.select(this.parentElement as Element).remove(); });
                    }

                    if (showCompanyNames) {
                        const nameDiv = element.append("div").attr("class", "pt-name");
                        if (company.url) {
                            nameDiv.append("a")
                                .attr("href", company.url)
                                .attr("target", "_blank")
                                .attr("rel", "noopener noreferrer")
                                .style("color", "inherit")
                                .style("text-decoration", "none")
                                .style("cursor", "pointer")
                                .on("mouseover", function () { d3.select(this).style("text-decoration", "underline"); })
                                .on("mouseout", function () { d3.select(this).style("text-decoration", "none"); })
                                .text(company.name);
                        } else {
                            nameDiv.text(company.name);
                        }
                    }

                    if (showCountry) {
                        element.append("div").attr("class", "pt-country").text(getCountryFlag(company.country));
                    }
                });
            });
        };

        if (effectiveTilesPerRow <= 5 && sortedGroups.length > 2) {
            const midpoint = Math.ceil(sortedGroups.length / 2);
            const leftCol = mainGrid.append("div").attr("class", "periodic-table-grid");
            const rightCol = mainGrid.append("div").attr("class", "periodic-table-grid");
            renderGroups(sortedGroups.slice(0, midpoint), leftCol);
            renderGroups(sortedGroups.slice(midpoint), rightCol);
        } else {
            renderGroups(sortedGroups, mainGrid);
        }
    }, [data, groupBy, sortBy, colorBy, showLogos, activeMode, customList, globalTilesPerRow, customTilesPerRow, showCompanyNames, showCountry]);

    return (
        <div className={cn("relative w-full h-full flex flex-col", compact && "p-0 overflow-hidden")}>
            {!compact && (
                <>
                    <h1 className="text-3xl font-bold text-center pt-6 pb-2 text-foreground tracking-tight">
                        Periodic Table of Startups
                    </h1>
                    {activeMode !== "custom" && (
                        <p className="text-center text-sm text-muted-foreground mb-4">
                            Showing top <span className="font-bold text-foreground">{globalTilesPerRow}</span> startups per group
                        </p>
                    )}
                </>
            )}

            {/* Controls */}
            {!preview && <div className={cn("filter-bar grid grid-cols-3 gap-0 border-b border-border", compact && "grid-cols-1 border-0")}>
                {/* Layout */}
                <div className="border-r border-border p-4 bg-blue-500/5">
                    <h3 className="text-xs font-semibold uppercase mb-3 text-muted-foreground">Layout</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="text-sm min-w-[50px]">Mode</label>
                            <div className="flex bg-muted rounded p-0.5">
                                {(["global", "linkedin", "custom"] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => {
                                            setActiveMode(mode);
                                            if (mode === "custom") { setGroupBy("investment"); setSortBy("score"); }
                                        }}
                                        className={cn(
                                            "px-3 py-1 text-[10px] uppercase font-bold rounded transition-all",
                                            activeMode === mode
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm min-w-[80px]">Group By</label>
                            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}
                                className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm disabled:opacity-50"
                                disabled={activeMode === "custom"}>
                                <option value="investment">Investment List</option>
                                <option value="discipline">Discipline</option>
                                <option value="lifecycle">Lifecycle Phase</option>
                                <option value="subsegment">Subsegment</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm min-w-[80px]">Sort By</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                                className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm">
                                <option value="score">Weighted Score</option>
                                <option value="valuation">Market Value</option>
                                <option value="funding">Total Funding</option>
                                <option value="headcount">Headcount</option>
                                <option value="name">Company Name</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Style */}
                <div className="border-r border-border p-4 bg-purple-500/5">
                    <h3 className="text-xs font-semibold uppercase mb-3 text-muted-foreground">Style</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                            <label className="text-sm">Color</label>
                            <select value={colorBy} onChange={(e) => setColorBy(e.target.value as any)}
                                className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm">
                                <option value="investment">Investment List</option>
                                <option value="country">Country</option>
                                <option value="funding-round">Funding Round</option>
                                <option value="score">Score</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm">Size</label>
                            <select value={elementSize} onChange={(e) => setElementSize(e.target.value as any)}
                                className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm">
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                            </select>
                        </div>
                        <label className="text-sm flex items-center gap-2 cursor-pointer col-span-1">
                            <input type="checkbox" checked={showCompanyNames} onChange={(e) => setShowCompanyNames(e.target.checked)} className="rounded border-border" />
                            Show Names
                        </label>
                        <div className="flex items-center gap-2">
                            <label className="text-sm truncate">{activeMode === "custom" ? "Custom" : "Global"} Tiles/Row</label>
                            <select
                                value={activeMode === "custom" ? customTilesPerRow : globalTilesPerRow}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    activeMode === "custom" ? setCustomTilesPerRow(val) : setGlobalTilesPerRow(val);
                                }}
                                className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm font-mono">
                                {[3, 5, 8, 10, 12, 15, 18, 20, 25, 30].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                        <label className="text-sm flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showCountry} onChange={(e) => setShowCountry(e.target.checked)} className="rounded border-border" />
                            Show Country
                        </label>
                    </div>
                </div>

                {/* Custom / Info */}
                {activeMode === "custom" ? (
                    <div className="p-4 bg-orange-500/5">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Selection ({customList.length})</h3>
                            {customList.length > 0 && (
                                <button onClick={() => setCustomList([])} className="text-[10px] lowercase text-primary hover:underline">Clear all</button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex gap-2 pb-2 border-b border-border/50">
                                <input type="text" placeholder="View name..." value={viewName} onChange={(e) => setViewName(e.target.value)}
                                    className="flex-1 bg-background border border-border rounded px-2 py-1 text-[10px] focus:outline-none" />
                                <button onClick={saveCurrentView} disabled={!viewName || !customList.length}
                                    className="bg-primary text-white px-2 py-1 rounded text-[10px] font-semibold disabled:opacity-50">
                                    Save
                                </button>
                                {Object.keys(savedViews).length > 0 && (
                                    <select onChange={(e) => loadView(e.target.value)} className="bg-background border border-border rounded px-1 py-1 text-[10px] max-w-[90px]" value="">
                                        <option value="" disabled>Load...</option>
                                        {Object.keys(savedViews).map(name => <option key={name} value={name}>{name}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="flex bg-muted rounded p-1">
                                {(["search", "paste"] as const).map(m => (
                                    <button key={m} onClick={() => setPasteMode(m)}
                                        className={cn("flex-1 text-[10px] py-1 rounded transition-all", pasteMode === m ? "bg-background shadow-sm font-semibold" : "text-muted-foreground")}>
                                        {m === "search" ? "Search" : "Bulk Paste"}
                                    </button>
                                ))}
                            </div>
                            {pasteMode === "search" ? (
                                <div className="relative">
                                    <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
                                    <input type="text" placeholder="Search and add..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-background border border-border rounded pl-7 pr-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                                    {searchTerm && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-[60] max-h-[200px] overflow-auto">
                                            {data.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) && !customList.includes(d.name)).slice(0, 8).map(company => (
                                                <div key={company.id} onClick={() => { setCustomList([...customList, company.name]); setSearchTerm(""); }}
                                                    className="px-3 py-2 text-xs hover:bg-muted cursor-pointer transition-colors border-b border-border/50 last:border-0">
                                                    {company.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <textarea className="w-full h-24 bg-background border border-border rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                                        placeholder="Paste names (comma or newline separated)..." value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
                                    <button onClick={() => {
                                        const names = pasteText.split(/[,\n]/).map(n => n.trim()).filter(n => n);
                                        const validNames = data.filter(d => names.some(n => d.name.toLowerCase() === n.toLowerCase())).map(d => d.name);
                                        setCustomList(prev => Array.from(new Set([...prev, ...validNames])));
                                        setPasteText(""); setPasteMode("search");
                                    }} className="w-full bg-primary text-white text-[10px] py-1.5 rounded font-semibold hover:bg-primary/90">
                                        Apply Selection
                                    </button>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-1 max-h-[80px] overflow-auto pt-1">
                                {customList.map(name => (
                                    <div key={name} className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">
                                        <span className="text-primary truncate max-w-[80px]">{name}</span>
                                        <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => setCustomList(customList.filter(n => n !== name))} />
                                    </div>
                                ))}
                                {customList.length === 0 && <div className="text-[10px] text-muted-foreground italic w-full text-center py-2">No companies selected</div>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-slate-500/5">
                        <h3 className="text-xs font-semibold uppercase mb-3 text-muted-foreground">Info</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>Total Companies: {data.length}</p>
                            <p>Top {globalTilesPerRow} per group</p>
                        </div>
                    </div>
                )}
            </div>}

            {/* Table */}
            <div className={`flex-1 overflow-auto p-6 size-${elementSize}`}>
                <div ref={containerRef} className="periodic-table-container" />
            </div>

            {/* Detail panel */}
            {!preview && selectedElement && (
                <div className="fixed right-5 top-24 z-50">
                    <CompanyHoverCard
                        company={selectedElement}
                        onClose={() => setSelectedElement(null)}
                    />
                </div>
            )}
        </div>
    );
}
