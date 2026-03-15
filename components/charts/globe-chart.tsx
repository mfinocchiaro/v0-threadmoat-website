"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import * as d3 from "d3";
import { Company } from "@/lib/company-data";
import { formatCurrency } from "@/lib/company-data";

// ---------- Hub coordinate map ----------
const HUB_COORDS: Record<string, [number, number]> = {
  // US sub-regions
  "Bay Area":        [37.5630, -122.0519],
  "LA / San Diego":  [34.0195, -118.4912],
  "Seattle":         [47.6062, -122.3321],
  "Boston / NYC":    [41.2033, -74.0059],
  "Rest of USA":     [39.8283, -98.5795],
  // Countries
  "Australia":       [-25.2744, 133.7751],
  "Austria":         [47.5162, 14.5501],
  "Belgium":         [50.5039, 4.4699],
  "Brazil":          [-14.2350, -51.9253],
  "Canada":          [56.1304, -106.3468],
  "China":           [35.8617, 104.1954],
  "Czech Republic":  [49.8175, 15.4730],
  "Denmark":         [56.2639, 9.5018],
  "Estonia":         [58.5953, 25.0136],
  "Finland":         [61.9241, 25.7482],
  "France":          [46.2276, 2.2137],
  "Germany":         [51.1657, 10.4515],
  "Hungary":         [47.1625, 19.5033],
  "Iceland":         [64.9631, -19.0208],
  "India":           [20.5937, 78.9629],
  "Ireland":         [53.4129, -8.2439],
  "Israel":          [31.0461, 34.8516],
  "Italy":           [41.8719, 12.5674],
  "Japan":           [36.2048, 138.2529],
  "Latvia":          [56.8796, 24.6032],
  "Netherlands":     [52.1326, 5.2913],
  "New Zealand":     [-40.9006, 174.8860],
  "Nigeria":         [9.0820, 8.6753],
  "Norway":          [60.4720, 8.4689],
  "Poland":          [51.9194, 19.1451],
  "Portugal":        [39.3999, -8.2245],
  "Romania":         [45.9432, 24.9668],
  "Singapore":       [1.3521, 103.8198],
  "Slovakia":        [48.6690, 19.6990],
  "South Africa":    [-30.5595, 22.9375],
  "South Korea":     [35.9078, 127.7669],
  "Spain":           [40.4637, -3.7492],
  "Sweden":          [60.1282, 18.6435],
  "Switzerland":     [46.8182, 8.2275],
  "Turkey":          [38.9637, 35.2433],
  "UAE":             [23.4241, 53.8478],
  "United Kingdom":  [55.3781, -3.4360],
  "Armenia":         [40.0691, 45.0382],
  "Cyprus":          [35.1264, 33.4299],
};

import { getInvestmentColor as getCategoryColor } from "@/lib/investment-colors";

// ---------- Strip emoji flag characters ----------
function stripEmoji(str: string): string {
  return str
    .replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, "")   // flag emoji pairs
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")        // other emoji
    .trim();
}

function isUS(country: string): boolean {
  const c = stripEmoji(country).toLowerCase().trim();
  return c === "united states" || c === "usa";
}

// ---------- US hub detection (keyword-based on hqLocation) ----------
const US_HUB_KEYWORDS: Array<{ hub: string; keywords: string[] }> = [
  {
    hub: "Bay Area",
    keywords: [
      "san francisco", "sf,", " sf ", "bay area", "san jose", "palo alto",
      "mountain view", "sunnyvale", "santa clara", "redwood", "menlo park",
      "cupertino", "fremont", "hayward", "san mateo", "foster city",
      "burlingame", "millbrae", "marin", "mill valley", "novato",
      "berkeley", "oakland", "emeryville", "san leandro", "walnut creek",
      "los gatos", "los altos", "atherton", "campbell", "saratoga",
      "morgan hill", "gilroy", "pleasanton", "livermore", "concord, ca",
      "south san francisco", "s. san francisco", "ssf",
    ],
  },
  {
    hub: "LA / San Diego",
    keywords: [
      "los angeles", ", la,", "la,", "san diego", "santa monica",
      "culver city", "irvine", "pasadena", "long beach", "el segundo",
      "torrance", "chatsworth", "chula vista", "anaheim", "brea",
      "newport beach", "laguna", "thousand oaks", "camarillo", "ventura",
      "santa barbara", "huntington beach", "fullerton", "escondido",
      "carlsbad", "encinitas", "el cajon", "oxnard", "glendale", "burbank",
      "pomona", "ontario, ca", "riverside, ca", "san bernardino",
      "manhattan beach", "hermosa beach", "costa mesa", "orange, ca",
    ],
  },
  {
    hub: "Seattle",
    keywords: [
      "seattle", "bellevue", "redmond", "kirkland", "tacoma",
      "bothell", "everett", "renton", "issaquah", "kent, wa",
    ],
  },
  {
    hub: "Boston / NYC",
    keywords: [
      "new york", "nyc", "brooklyn", "manhattan", "hoboken",
      "jersey city", "bronx", "queens", "staten island",
      "somerville", "waltham", "lexington, ma", "medford, ma",
      "marlborough", "cambridge, ma", "cambridge, massachusetts",
      "cambridge, m,", "boston", "new haven", "hartford",
      "providence", "newark", "woburn", "burlington, ma",
      "bedford, ma", "acton, ma", "natick", "framingham",
      "billerica", "chelmsford", "lowell", "andover, ma",
      "concord, ma", "concord, massachusetts", "stamford",
      "westport, ct", "greenwich, ct", "norwalk", "albany, ny",
    ],
  },
];

function resolveUSHub(hqLocation: string): string {
  const loc = hqLocation.toLowerCase();
  for (const { hub, keywords } of US_HUB_KEYWORDS) {
    if (keywords.some(kw => loc.includes(kw))) return hub;
  }
  return "Rest of USA";
}

function resolveHub(hqLocation: string, country: string): string {
  if (isUS(country)) return resolveUSHub(hqLocation);

  const clean = stripEmoji(country).trim();

  // Normalise variants
  if (clean === "UK") return "United Kingdom";
  if (clean === "Switzerland🇨🇭" || clean === "Switzerland") return "Switzerland";
  if (clean === "Hungary 🇭🇺" || clean === "Hungary") return "Hungary";
  if (clean === "Norway 🇳🇴" || clean === "Norway") return "Norway";

  return clean || "Unknown";
}

// ---------- Aggregate companies into hubs ----------
interface HubPoint {
  hub: string;
  lat: number;
  lng: number;
  count: number;
  totalFunding: number;
  categories: Record<string, number>;
  topCompanies: string[];
  dominantCategory: string;
  altitude: number;
  color: string;
}

function aggregateHubs(data: Company[]): HubPoint[] {
  const map: Record<string, Omit<HubPoint, "altitude" | "color" | "dominantCategory"> & { _companies: { name: string; funding: number }[] }> = {};

  for (const c of data) {
    const hub = resolveHub(c.hqLocation, c.country);
    const coords = HUB_COORDS[hub];
    if (!coords) continue; // skip unknown hubs

    if (!map[hub]) {
      map[hub] = {
        hub,
        lat: coords[0],
        lng: coords[1],
        count: 0,
        totalFunding: 0,
        categories: {},
        topCompanies: [],
        _companies: [],
      } as Omit<HubPoint, "altitude" | "color" | "dominantCategory"> & { _companies: { name: string; funding: number }[] };
    }

    map[hub].count++;
    map[hub].totalFunding += c.totalFunding || 0;
    map[hub]._companies.push({ name: c.name, funding: c.totalFunding || 0 });

    const cat = c.investmentList || "Other";
    map[hub].categories[cat] = (map[hub].categories[cat] || 0) + 1;
  }

  // Resolve top 3 companies per hub (by funding)
  for (const h of Object.values(map)) {
    h.topCompanies = h._companies
      .sort((a, b) => b.funding - a.funding)
      .slice(0, 3)
      .map(c => c.name);
  }

  const hubs = Object.values(map);
  const maxCount = Math.max(...hubs.map(h => h.count), 1);

  return hubs
    .sort((a, b) => b.count - a.count)
    .map(h => {
      const dominant = Object.entries(h.categories).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "Other";
      return {
        ...h,
        dominantCategory: dominant,
        altitude: 0.02 + (h.count / maxCount) * 0.45,
        color: getCategoryColor(dominant),
      };
    });
}

// ---------- Globe dynamic import ----------
const GlobeDynamic = dynamic(() => import("react-globe.gl"), { ssr: false });

interface GlobeChartProps {
  data: Company[];
}

export function GlobeChart({ data }: GlobeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [selectedHub, setSelectedHub] = useState<HubPoint | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setDims({ width: el.clientWidth, height: el.clientHeight });
    const obs = new ResizeObserver(update);
    obs.observe(el);
    update();
    return () => obs.disconnect();
  }, []);

  const hubPoints = useMemo(() => aggregateHubs(data), [data]);

  const categoryEntries = useMemo(() => {
    const cats = new Set<string>();
    data.forEach(c => { if (c.investmentList) cats.add(c.investmentList); });
    return Array.from(cats).sort();
  }, [data]);

  function buildLabel(d: object): string {
    const h = d as HubPoint;
    const rows = Object.entries(h.categories)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, cnt]) => {
        const short = cat.replace(/^\d+-/, "").replace(" Intelligence", "");
        return `<span style="color:${getCategoryColor(cat)}">■</span> ${short}: ${cnt}`;
      })
      .join("<br/>");
    const topNames = h.topCompanies.length > 0
      ? `<div style="margin-top:6px;border-top:1px solid rgba(255,255,255,.1);padding-top:6px"><span style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.5px">Top startups</span><br/>${h.topCompanies.map(n => { const w = n.split(/\s+/).filter(Boolean); const ini = w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase(); return `<span style="color:#e2e8f0">› ${ini}</span>`; }).join("<br/>")}</div>`
      : "";
    return `
      <div style="background:rgba(10,14,23,.92);border:1px solid rgba(255,255,255,.15);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;min-width:200px;line-height:1.6">
        <strong style="font-size:14px">${h.hub}</strong><br/>
        <span style="color:#94a3b8">${h.count} companies · ${formatCurrency(h.totalFunding)}</span><br/>
        <div style="margin-top:6px">${rows}</div>
        ${topNames}
      </div>`;
  }

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {dims.width > 0 && dims.height > 0 && (
        <>
          <GlobeDynamic
            width={dims.width}
            height={dims.height}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            backgroundColor="rgba(0,0,0,0)"
            pointsData={hubPoints}
            pointLat="lat"
            pointLng="lng"
            pointAltitude="altitude"
            pointColor="color"
            pointRadius={0.6}
            pointLabel={buildLabel}
            pointsMerge={false}
            onPointClick={(point: object) => setSelectedHub(point as HubPoint)}
          />

          {/* Category legend */}
          <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-sm">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Category (dominant)
            </p>
            <div className="space-y-1">
              {categoryEntries.map(cat => (
                <div key={cat} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: getCategoryColor(cat) }}
                  />
                  <span className="text-[11px] text-white/80">
                    {cat.replace(/^\d+-/, "").replace(" Intelligence", "")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hub summary or selected hub detail */}
          {selectedHub ? (
            <div className="absolute top-4 right-4 rounded-lg border border-white/10 bg-black/80 px-4 py-3 backdrop-blur-sm text-white text-xs w-64">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-sm">{selectedHub.hub}</p>
                <button
                  onClick={() => setSelectedHub(null)}
                  className="text-white/40 hover:text-white text-sm leading-none"
                >
                  ✕
                </button>
              </div>
              <p className="text-white/60 mb-3">
                {selectedHub.count} companies · {formatCurrency(selectedHub.totalFunding)}
              </p>
              <div className="space-y-1 mb-3">
                {Object.entries(selectedHub.categories)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, cnt]) => (
                    <div key={cat} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ background: getCategoryColor(cat) }}
                      />
                      <span className="text-white/80 flex-1 truncate">
                        {cat.replace(/^\d+-/, "").replace(" Intelligence", "")}
                      </span>
                      <span className="text-white/50">{cnt}</span>
                    </div>
                  ))}
              </div>
              {selectedHub.topCompanies.length > 0 && (
                <div className="border-t border-white/10 pt-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Top Startups</p>
                  {selectedHub.topCompanies.map((name, i) => {
                    const words = name.split(/\s+/).filter(Boolean);
                    const initials = words.length >= 2
                      ? (words[0][0] + words[1][0]).toUpperCase()
                      : name.substring(0, 2).toUpperCase();
                    return (
                      <p key={i} className="text-white/80">
                        <span className="text-white/50 mr-1">{i + 1}.</span> {initials}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute top-4 right-4 rounded-lg border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-sm text-white/80 text-xs">
              <p className="font-semibold text-white mb-1">
                {hubPoints.reduce((s, h) => s + h.count, 0)} companies · {hubPoints.length} hubs
              </p>
              <p className="text-white/50">Bar height = company count</p>
              <p className="text-white/50">Click a bar for details</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
