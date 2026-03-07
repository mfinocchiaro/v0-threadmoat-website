"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { Company, formatCurrency } from "@/lib/company-data";
import { useFilter } from "@/contexts/filter-context";
import { cn } from "@/lib/utils";
import { CompanyDetailsDialog } from "@/components/company-details-dialog";
import { HubDetailsDialog } from "@/components/hub-details-dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface MapChartProps {
  data: Company[];
  className?: string;
}

// Stable coordinates for hubs with unreliable GeoJSON feature matching
const HUB_COORDINATES: Record<string, [number, number]> = {
  "Bay Area": [-122.4194, 37.7749],
  "New York": [-74.006, 40.7128],
  Denver: [-104.9903, 39.7392],
  "Los Angeles": [-118.2437, 34.0522],
  Boston: [-71.0589, 42.3601],
  Chicago: [-87.6298, 41.8781],
  Canada: [-106.3468, 56.1304],
};

const US_HUBS = new Set([
  "Bay Area",
  "New York",
  "Denver",
  "Los Angeles",
  "Boston",
  "Chicago",
  "United States",
  "USA",
]);

const canonicalCountry = (name?: string | null) => {
  if (!name) return "";
  const n = name.toLowerCase();
  if (n.includes("united states")) return "United States";
  if (n.includes("united kingdom")) return "United Kingdom";
  if (n.includes("south korea")) return "South Korea";
  return name;
};

const COUNTRY_ISO: Record<string, string> = {
  "United States": "us",
  USA: "us",
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
};

export function MapChart({ data = [], className }: MapChartProps) {
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

  // When a country is clicked, we zoom and filter bubbles to that country/hub
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

  const bubblesData = useMemo(() => {
    if (!data.length) return [];

    const hubMap = new Map<string, any>();

    const resolveHub = (c: Company) => {
      const loc = (c.hqLocation || "").toLowerCase();
      const country = (c.country || "Unknown")
        .replace(/[\u{1F300}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, "")
        .trim();

      if (country === "Canada") return "Canada";

      if (country === "United States") {
        if (["san francisco", "bay area", "palo alto", "mountain view", "menlo park"].some((k) =>
          loc.includes(k),
        )) return "Bay Area";
        if (loc.includes("new york") || loc.includes("nyc")) return "New York";
        if (loc.includes("boston") || loc.includes("cambridge")) return "Boston";
        if (loc.includes("los angeles") || loc.includes("santa monica")) return "Los Angeles";
        if (loc.includes("denver") || loc.includes("boulder")) return "Denver";
        if (loc.includes("chicago")) return "Chicago";
      }

      return country;
    };

    data.forEach((c) => {
      const key = resolveHub(c);
      if (!hubMap.has(key)) {
        hubMap.set(key, {
          count: 0,
          funding: 0,
          headcount: 0,
          score: 0,
          marketValue: 0,
          companies: [],
          name: key,
          lat: undefined,
          lng: undefined,
        });
      }

      const entry = hubMap.get(key)!;
      entry.count++;
      entry.funding += c.totalFunding || 0;
      entry.headcount += c.headcount || 0;
      entry.score += c.weightedScore || 0;
      entry.marketValue += c.estimatedMarketValue || 0;
      entry.companies.push(c);

      // Use company lat/long only if we don't already have a stable coordinate
      if (!HUB_COORDINATES[key] && entry.lat === undefined && c.latitude && c.longitude) {
        entry.lat = c.latitude;
        entry.lng = c.longitude;
      }
    });

    const results: any[] = [];

    hubMap.forEach((val, key) => {
      let coords: [number, number] | null = null;

      if (HUB_COORDINATES[key]) {
        coords = HUB_COORDINATES[key];
      } else if (val.lat !== undefined) {
        coords = [val.lng, val.lat];
      } else if (geoData) {
        // Default to country centroid when possible
        const feature = geoData.features.find(
          (f: any) =>
            canonicalCountry(f.properties?.name) === key ||
            f.properties?.name === key ||
            f.properties?.name?.includes(key),
        );
        if (feature) coords = d3.geoCentroid(feature);
      }

      if (coords) {
        const m = (filters as any).metrics || "totalFunding";
        let metricValue = 0;

        if (m === "totalFunding") metricValue = val.funding;
        else if (m === "headcount") metricValue = val.headcount;
        else if (m === "weightedScore") metricValue = val.score / val.count;
        else if (m === "estimatedMarketValue") metricValue = val.marketValue;
        else metricValue = val.count;

        results.push({
          ...val,
          coords,
          metricValue,
          // FIX: only treat known US hubs as US, otherwise use the country key itself
          countryForFlag: key === "Canada" ? "Canada" : US_HUBS.has(key) ? "United States" : key,
        });
      }
    });

    return results;
  }, [data, geoData, filters]);

  const { visibleBubbles, visibleScales } = useMemo(() => {
    const bubbles =
      selectedCountry == null
        ? bubblesData
        : bubblesData.filter(
            (d) => canonicalCountry(d.countryForFlag) === canonicalCountry(selectedCountry),
          );

    if (!bubbles.length) return { visibleBubbles: bubbles, visibleScales: null };

    return {
      visibleBubbles: bubbles,
      visibleScales: {
        size: d3
          .scaleSqrt()
          .domain([0, d3.max(bubbles, (d) => d.metricValue) || 1])
          .range([4, 40]),
        color: d3
          .scaleSequential(d3.interpolateBlues)
          .domain([0, d3.max(bubbles, (d) => d.funding) || 1000]),
      },
    };
  }, [bubblesData, selectedCountry]);

  const zoomToFeature = (feat: any) => {
    if (!zoomRef.current || !svgRef.current || !projectionRef.current) return;

    const path = d3.geoPath().projection(projectionRef.current);
    const [[x0, y0], [x1, y1]] = path.bounds(feat);
    const { width, height } = dimensions;

    const scale = Math.max(
      1,
      Math.min(12, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)),
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
  };

  const handleHubClick = (d: any) => {
    if (d.companies.length === 1) {
      setSelectedCompany(d.companies[0]);
      setDialogOpen(true);
    } else {
      setSelectedHub({ name: d.name, companies: d.companies });
      setHubDialogOpen(true);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !geoData || !dimensions.width) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");
    const projection = d3.geoNaturalEarth1().fitSize([width, height], geoData);
    projectionRef.current = projection;

    const path = d3.geoPath().projection(projection);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .on("zoom", (event) => g.attr("transform", event.transform));

    zoomRef.current = zoom;
    svg.call(zoom);

    g.append("path").datum({ type: "Sphere" } as any).attr("d", path as any).attr("fill", "#020617");

    g.selectAll("path.country")
      .data(geoData.features)
      .join("path")
      .attr("class", "country")
      .attr("d", path as any)
      .attr("fill", "#1e293b")
      .attr("stroke", "#334155")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", function () {
        d3.select(this).attr("fill", "#334155");
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "#1e293b");
      })
      .on("click", (event: MouseEvent, d: any) => {
        event.stopPropagation();
        const country = canonicalCountry(d.properties?.name);
        setSelectedCountry(country || null);
        zoomToFeature(d);
      });

    if (visibleScales) {
      const tooltip = d3.select("#map-tooltip");

      g.selectAll(".bubble-group")
        .data(visibleBubbles)
        .join("g")
        .attr("class", "bubble-group")
        .style("cursor", "pointer")
        .on("mouseover", (event, d: any) => {
          const iso = COUNTRY_ISO[d.countryForFlag] || "un";
          tooltip.style("visibility", "visible").html(`
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1)">
              <img src="https://flagcdn.com/w40/${iso}.png" width="20" style="border-radius:2px" />
              <strong style="font-size:14px">${d.name}</strong>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:11px;opacity:0.9">
              <span>Companies:</span><span style="text-align:right;font-weight:700">${d.count}</span>
              <span>Funding:</span><span style="text-align:right;font-weight:700">${formatCurrency(d.funding)}</span>
              <span>Headcount:</span><span style="text-align:right;font-weight:700">${d.headcount.toLocaleString()}</span>
              <span>Avg Score:</span><span style="text-align:right;font-weight:700">${(d.score / d.count).toFixed(1)}</span>
            </div>
          `);
        })
        .on("mousemove", (event) => {
          tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"))
        .on("click", (event, d: any) => {
          event.stopPropagation();
          handleHubClick(d);
        })
        .each(function (d: any) {
          const pos = projection(d.coords);
          if (!pos) return;

          const [cx, cy] = pos;
          const r = visibleScales.size(d.metricValue);

          d3.select(this)
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", r)
            .attr("fill", visibleScales.color(d.funding))
            .attr("fill-opacity", 0.8)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);

          if (r > 12) {
            d3.select(this)
              .append("text")
              .attr("x", cx)
              .attr("y", cy)
              .attr("dy", 4)
              .attr("text-anchor", "middle")
              .style("font-size", "10px")
              .style("font-weight", "bold")
              .style("fill", "white")
              .style("pointer-events", "none")
              .text(d.count);
          }
        });
    }
  }, [geoData, dimensions, bubblesData, visibleBubbles, visibleScales]);

  const resetView = () => {
    setSelectedCountry(null);

    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full h-full bg-slate-950 rounded-lg overflow-hidden group/map",
        className,
      )}
      ref={containerRef}
    >
      <svg ref={svgRef} className="w-full h-full block" />

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

      <div
        id="map-tooltip"
        className="fixed invisible pointer-events-none z-[9999] bg-slate-900/95 text-white p-3 rounded-lg border border-white/10 backdrop-blur-md shadow-2xl text-sm"
      />
    </div>
  );
}
