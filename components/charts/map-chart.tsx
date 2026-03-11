"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { Company, formatCurrency } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { cn } from "@/lib/utils";
import { CompanyDetailsDialog } from "@/components/company-details-dialog";
import { HubDetailsDialog } from "@/components/hub-details-dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { CITY_COORDINATES } from "@/lib/city-coordinates";

interface MapChartProps {
  data: Company[];
  className?: string;
  preview?: boolean;
}

const canonicalCountry = (name?: string | null) => {
  if (!name) return "";
  const n = name.toLowerCase();
  if (n.includes("united states") || n === "usa") return "United States";
  if (n.includes("united kingdom")) return "United Kingdom";
  if (n.includes("south korea")) return "South Korea";
  return name;
};

// Map GeoJSON country names to our canonical names
const GEO_NAME_MAP: Record<string, string> = {
  "United States of America": "United States",
  "S. Korea": "South Korea",
  "Dem. Rep. Korea": "North Korea",
  "Czech Rep.": "Czech Republic",
  "Dominican Rep.": "Dominican Republic",
  "Côte d'Ivoire": "Ivory Coast",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Central African Rep.": "Central African Republic",
  "Eq. Guinea": "Equatorial Guinea",
  "eSwatini": "Eswatini",
  "Solomon Is.": "Solomon Islands",
};

const COUNTRY_ISO: Record<string, string> = {
  "United States": "us",
  Canada: "ca",
  "United Kingdom": "gb",
  France: "fr",
  Germany: "de",
  Israel: "il",
  Brazil: "br",
  India: "in",
  China: "cn",
  "South Korea": "kr",
  Japan: "jp",
  Australia: "au",
  Switzerland: "ch",
  Netherlands: "nl",
  Sweden: "se",
  Singapore: "sg",
  Ireland: "ie",
  Spain: "es",
  Italy: "it",
  Finland: "fi",
  Norway: "no",
  Denmark: "dk",
  Austria: "at",
  Belgium: "be",
  Portugal: "pt",
  Poland: "pl",
  "New Zealand": "nz",
  "Czech Republic": "cz",
  Estonia: "ee",
  Lithuania: "lt",
  Latvia: "lv",
  Romania: "ro",
  Hungary: "hu",
  Greece: "gr",
  Turkey: "tr",
  Mexico: "mx",
  Chile: "cl",
  Argentina: "ar",
  Colombia: "co",
  "South Africa": "za",
  Nigeria: "ng",
  Kenya: "ke",
  Egypt: "eg",
  "United Arab Emirates": "ae",
  "Saudi Arabia": "sa",
  Taiwan: "tw",
  Thailand: "th",
  Vietnam: "vn",
  Indonesia: "id",
  Malaysia: "my",
  Philippines: "ph",
};

/** Extract a city name from hqLocation string */
function extractCity(hqLocation: string | undefined | null): string {
  if (!hqLocation) return "Unknown";
  // hqLocation is typically "City, State, Country" or "City, Country"
  const parts = hqLocation.split(",").map((s) => s.trim());
  // First part is usually the city
  return parts[0] || "Unknown";
}

export function MapChart({ data = [], className, preview = false }: MapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<any>(null);
  const projectionRef = useRef<any>(null);
  const { filters } = useFilter();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHub, setSelectedHub] = useState<{
    name: string;
    companies: Company[];
  } | null>(null);
  const [hubDialogOpen, setHubDialogOpen] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(
      (world: any) => {
        if (world) setGeoData(topojson.feature(world, world.objects.countries));
      },
    );

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Country-level counts for choropleth
  const countryStats = useMemo(() => {
    const counts = new Map<string, { count: number; funding: number; companies: Company[] }>();
    for (const c of data) {
      const country = canonicalCountry(
        (c.country || "Unknown").replace(/[\u{1F300}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, "").trim(),
      );
      if (!counts.has(country)) counts.set(country, { count: 0, funding: 0, companies: [] });
      const entry = counts.get(country)!;
      entry.count++;
      entry.funding += c.totalFunding || 0;
      entry.companies.push(c);
    }
    return counts;
  }, [data]);

  // City-level bubbles for the selected country
  const cityBubbles = useMemo(() => {
    if (!selectedCountry || !geoData) return [];

    const stats = countryStats.get(selectedCountry);
    if (!stats) return [];

    const cityMap = new Map<string, {
      name: string;
      count: number;
      funding: number;
      headcount: number;
      score: number;
      companies: Company[];
      lat?: number;
      lng?: number;
    }>();

    for (const c of stats.companies) {
      const city = extractCity(c.hqLocation);
      if (!cityMap.has(city)) {
        cityMap.set(city, {
          name: city,
          count: 0,
          funding: 0,
          headcount: 0,
          score: 0,
          companies: [],
        });
      }
      const entry = cityMap.get(city)!;
      entry.count++;
      entry.funding += c.totalFunding || 0;
      entry.headcount += c.headcount || 0;
      entry.score += c.weightedScore || 0;
      entry.companies.push(c);
      if (entry.lat === undefined && c.latitude && c.longitude) {
        entry.lat = c.latitude;
        entry.lng = c.longitude;
      }
    }

    // Find country feature and compute mainland centroid
    // For MultiPolygon countries (e.g. France with overseas territories),
    // use only the largest polygon so the centroid lands on the mainland.
    const countryFeature = geoData.features.find((f: any) => {
      const geoName = GEO_NAME_MAP[f.properties?.name] || f.properties?.name;
      return canonicalCountry(geoName) === selectedCountry;
    });
    let countryCentroid: [number, number] | null = null;
    if (countryFeature) {
      if (countryFeature.geometry.type === "MultiPolygon") {
        // Pick the polygon with the most coordinates (= mainland)
        let largest = countryFeature.geometry.coordinates[0];
        let maxLen = 0;
        for (const poly of countryFeature.geometry.coordinates) {
          const len = poly[0]?.length || 0;
          if (len > maxLen) { maxLen = len; largest = poly; }
        }
        countryCentroid = d3.geoCentroid({ type: "Polygon", coordinates: largest } as any);
      } else {
        countryCentroid = d3.geoCentroid(countryFeature);
      }
    }

    const results: any[] = [];
    cityMap.forEach((val) => {
      let coords: [number, number] | null = null;
      if (val.lat !== undefined && val.lng !== undefined) {
        coords = [val.lng, val.lat];
      } else {
        // Static geocoding lookup
        const lookupKey = `${val.name}|${selectedCountry}`;
        const lookup = CITY_COORDINATES[lookupKey];
        if (lookup) {
          coords = lookup;
        } else if (countryCentroid) {
          // Last resort: jitter from mainland centroid
          coords = [
            countryCentroid[0] + (Math.random() - 0.5) * 1.5,
            countryCentroid[1] + (Math.random() - 0.5) * 1.5,
          ];
        }
      }
      if (coords) {
        results.push({ ...val, coords, countryForFlag: selectedCountry });
      }
    });

    return results;
  }, [selectedCountry, countryStats, geoData]);

  const cityScales = useMemo(() => {
    if (!cityBubbles.length) return null;
    const maxCount = d3.max(cityBubbles, (d) => d.count) || 1;
    return {
      size: d3.scaleSqrt().domain([0, maxCount]).range([2, 5]),
    };
  }, [cityBubbles]);

  const resolveGeoName = useCallback(
    (featureName: string) => canonicalCountry(GEO_NAME_MAP[featureName] || featureName),
    [],
  );

  const zoomToFeature = useCallback(
    (feat: any) => {
      if (!zoomRef.current || !svgRef.current || !projectionRef.current) return;

      const path = d3.geoPath().projection(projectionRef.current);
      const [[x0, y0], [x1, y1]] = path.bounds(feat);
      const { width, height } = dimensions;

      const scale = Math.max(
        1,
        Math.min(20, 0.85 / Math.max((x1 - x0) / width, (y1 - y0) / height)),
      );

      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(
          zoomRef.current.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(scale)
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        );
    },
    [dimensions],
  );

  const handleHubClick = useCallback(
    (d: any) => {
      if (preview) return;
      if (d.companies.length === 1) {
        setSelectedCompany(d.companies[0]);
        setDialogOpen(true);
      } else {
        setSelectedHub({ name: d.name, companies: d.companies });
        setHubDialogOpen(true);
      }
    },
    [preview],
  );

  // Choropleth color scale
  const choroplethScale = useMemo(() => {
    const maxCount = d3.max(Array.from(countryStats.values()), (d) => d.count) || 1;
    // Blue (cool / low) → Red (hot / high)
    return d3
      .scaleSequential(d3.interpolateRdYlBu)
      .domain([maxCount, 0]); // reversed so blue=low, red=high
  }, [countryStats]);

  useEffect(() => {
    if (!svgRef.current || !geoData || !dimensions.width) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");
    const projection = d3.geoNaturalEarth1().fitSize([width, height], geoData);
    projectionRef.current = projection;

    const path = d3.geoPath().projection(projection);

    // Overlay group for city bubbles — NOT affected by zoom transform
    const overlay = svg.append("g").attr("class", "city-overlay");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        // Re-project city bubbles to screen coordinates on every zoom frame
        overlay.selectAll<SVGGElement, any>(".city-bubble").each(function (d: any) {
          const projected = projection(d.coords);
          if (!projected) return;
          const [sx, sy] = event.transform.apply(projected);
          d3.select(this).attr("transform", `translate(${sx},${sy})`);
        });
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Ocean
    g.append("path")
      .datum({ type: "Sphere" } as any)
      .attr("d", path as any)
      .attr("fill", "#020617");

    const tooltip = d3.select("#map-tooltip");

    // Countries with choropleth coloring
    g.selectAll("path.country")
      .data(geoData.features)
      .join("path")
      .attr("class", "country")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        const country = resolveGeoName(d.properties?.name || "");
        const stats = countryStats.get(country);
        if (!stats || stats.count === 0) return "#1e293b"; // grey for no startups
        return choroplethScale(stats.count) as string;
      })
      .attr("stroke", "#334155")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", function (event: MouseEvent, d: any) {
        const country = resolveGeoName(d.properties?.name || "");
        const stats = countryStats.get(country);
        // Lighten on hover
        d3.select(this).attr("opacity", 0.8);
        if (stats && stats.count > 0) {
          const iso = COUNTRY_ISO[country] || "un";
          tooltip.style("visibility", "visible").html(`
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1)">
              <img src="https://flagcdn.com/w40/${iso}.png" width="20" style="border-radius:2px" />
              <strong style="font-size:13px">${country}</strong>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;font-size:11px;opacity:0.9">
              <span>Startups:</span><span style="text-align:right;font-weight:700">${stats.count}</span>
              <span>Funding:</span><span style="text-align:right;font-weight:700">${formatCurrency(stats.funding)}</span>
            </div>
            <div style="margin-top:6px;font-size:10px;opacity:0.6">Click to explore cities</div>
          `);
        }
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        tooltip.style("visibility", "hidden");
      })
      .on("click", (event: MouseEvent, d: any) => {
        if (preview) return;
        event.stopPropagation();
        const country = resolveGeoName(d.properties?.name || "");
        setSelectedCountry(country || null);
        zoomToFeature(d);
      });

    // City bubbles — drawn in overlay (screen-space, unaffected by zoom)
    overlay.selectAll("*").remove();
    if (selectedCountry && cityBubbles.length > 0 && cityScales) {
      // Get current zoom transform to position bubbles correctly
      const currentTransform = d3.zoomTransform(svg.node()!);

      overlay
        .selectAll(".city-bubble")
        .data(cityBubbles)
        .join("g")
        .attr("class", "city-bubble")
        .attr("transform", (d: any) => {
          const projected = projection(d.coords);
          if (!projected) return "translate(-9999,-9999)";
          const [sx, sy] = currentTransform.apply(projected);
          return `translate(${sx},${sy})`;
        })
        .style("cursor", "pointer")
        .on("mouseover", (event: MouseEvent, d: any) => {
          const iso = COUNTRY_ISO[d.countryForFlag] || "un";
          tooltip.style("visibility", "visible").html(`
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1)">
              <img src="https://flagcdn.com/w40/${iso}.png" width="20" style="border-radius:2px" />
              <strong style="font-size:13px">${d.name}</strong>
              <span style="font-size:10px;opacity:0.6">${selectedCountry}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;font-size:11px;opacity:0.9">
              <span>Startups:</span><span style="text-align:right;font-weight:700">${d.count}</span>
              <span>Funding:</span><span style="text-align:right;font-weight:700">${formatCurrency(d.funding)}</span>
              <span>Headcount:</span><span style="text-align:right;font-weight:700">${d.headcount.toLocaleString()}</span>
              <span>Avg Score:</span><span style="text-align:right;font-weight:700">${(d.score / d.count).toFixed(1)}</span>
            </div>
            <div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);font-size:10px;opacity:0.8">
              ${d.companies.slice(0, 5).map((c: Company) => c.name).join(", ")}${d.companies.length > 5 ? ` +${d.companies.length - 5} more` : ""}
            </div>
          `);
        })
        .on("mousemove", (event: MouseEvent) => {
          tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"))
        .on("click", (event: MouseEvent, d: any) => {
          event.stopPropagation();
          handleHubClick(d);
        })
        .each(function (d: any) {
          const r = cityScales.size(d.count);

          d3.select(this)
            .append("circle")
            .attr("r", r)
            .attr("fill", "#ef4444")
            .attr("fill-opacity", 0.7)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.8);

          // City name label next to bubble
          d3.select(this)
            .append("text")
            .attr("dx", r + 3)
            .attr("dy", 3)
            .attr("text-anchor", "start")
            .style("font-size", "9px")
            .style("fill", "#e2e8f0")
            .style("pointer-events", "none")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.8)")
            .text(`${d.name} (${d.count})`);
        });
    }

    // Legend
    if (!preview) {
      const legendG = svg.append("g").attr("transform", `translate(16, ${height - 50})`);
      const maxCount = d3.max(Array.from(countryStats.values()), (d) => d.count) || 1;
      const legendWidth = 160;
      const legendHeight = 10;

      // Gradient
      const defs = svg.append("defs");
      const gradient = defs
        .append("linearGradient")
        .attr("id", "choropleth-legend")
        .attr("x1", "0%")
        .attr("x2", "100%");

      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        gradient
          .append("stop")
          .attr("offset", `${t * 100}%`)
          .attr("stop-color", choroplethScale(t * maxCount) as string);
      }

      legendG
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("rx", 3)
        .style("fill", "url(#choropleth-legend)");

      // Grey swatch for "0"
      legendG
        .append("rect")
        .attr("x", -20)
        .attr("width", 14)
        .attr("height", legendHeight)
        .attr("rx", 2)
        .attr("fill", "#1e293b")
        .attr("stroke", "#475569")
        .attr("stroke-width", 0.5);

      legendG
        .append("text")
        .attr("x", -13)
        .attr("y", legendHeight + 12)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .style("fill", "#94a3b8")
        .text("0");

      legendG
        .append("text")
        .attr("x", 0)
        .attr("y", legendHeight + 12)
        .style("font-size", "9px")
        .style("fill", "#94a3b8")
        .text("1");

      legendG
        .append("text")
        .attr("x", legendWidth)
        .attr("y", legendHeight + 12)
        .attr("text-anchor", "end")
        .style("font-size", "9px")
        .style("fill", "#94a3b8")
        .text(maxCount.toString());

      legendG
        .append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -4)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .style("fill", "#94a3b8")
        .text("Startups per country");
    }
  }, [geoData, dimensions, countryStats, choroplethScale, selectedCountry, cityBubbles, cityScales, preview, resolveGeoName, zoomToFeature, handleHubClick]);

  const resetView = () => {
    setSelectedCountry(null);

    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full bg-slate-950 rounded-lg overflow-hidden group/map min-h-[500px]",
        className,
      )}
      ref={containerRef}
    >
      <svg ref={svgRef} className="w-full block" style={{ minHeight: 500 }} />

      {/* Selected country badge */}
      {selectedCountry && (
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-700 px-3 py-1.5 text-sm text-white shadow-xl">
          {COUNTRY_ISO[selectedCountry] && (
            <img
              src={`https://flagcdn.com/w40/${COUNTRY_ISO[selectedCountry]}.png`}
              width={16}
              alt=""
              className="rounded-sm"
            />
          )}
          <span className="font-medium">{selectedCountry}</span>
          <span className="text-xs text-slate-400">
            {countryStats.get(selectedCountry)?.count || 0} startups
          </span>
        </div>
      )}

      <div className="absolute top-4 right-4 opacity-0 group-hover/map:opacity-100 transition-opacity pointer-events-none">
        <Button
          variant="outline"
          size="icon"
          onClick={resetView}
          className="size-8 bg-slate-900/80 backdrop-blur border-slate-700 pointer-events-auto hover:bg-slate-800 shadow-xl text-white"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      {!preview && (
        <>
          <HubDetailsDialog
            hubName={selectedHub?.name || ""}
            companies={selectedHub?.companies || []}
            open={hubDialogOpen}
            onOpenChange={setHubDialogOpen}
            onSelectCompany={(company) => {
              setSelectedCompany(company);
              setDialogOpen(true);
            }}
          />
          <CompanyDetailsDialog company={selectedCompany} open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
      )}

      <div
        id="map-tooltip"
        className="fixed invisible pointer-events-none z-[9999] bg-slate-900/95 text-white p-3 rounded-lg border border-white/10 backdrop-blur-md shadow-2xl text-sm"
      />
    </div>
  );
}
