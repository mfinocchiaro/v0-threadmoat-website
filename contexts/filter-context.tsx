"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { Company } from "@/lib/company-data"

interface FilterState {
  search: string
  investmentLists: string[]
  industries: string[]
  countries: string[]
  subsegments: string[]
  lifecycle: string[]
  fundingRound: string[]
  operatingModel: string[]
  categoryTags: string[]
  differentiationTags: string[]
  investmentTheses: string[]
  metrics: string
  oceanStrategy: "all" | "red" | "blue"
  sizeCategory: string[]
  ecosystemFlags: string[]
  fundingRange: [number, number] // [min, max] in dollars, [0,0] = no filter
}

interface FilterContextType {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  isSidebarOpen: boolean
  filterCompany: (company: Company) => boolean
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  investmentLists: [],
  industries: [],
  countries: [],
  subsegments: [],
  lifecycle: [],
  fundingRound: [],
  operatingModel: [],
  categoryTags: [],
  differentiationTags: [],
  investmentTheses: [],
  metrics: "totalFunding",
  oceanStrategy: "all",
  sizeCategory: [],
  ecosystemFlags: [],
  fundingRange: [0, 0],
}

/** Binary flag definitions for ecosystem compatibility filtering */
export const ECOSYSTEM_FLAGS: Record<string, { label: string; field: keyof Company; group: string }> = {
  "SolidWorks": { label: "SolidWorks", field: "flagSolidWorks", group: "CAD Ecosystem" },
  "CATIA": { label: "CATIA", field: "flagCATIA", group: "CAD Ecosystem" },
  "Siemens": { label: "Siemens", field: "flagSiemens", group: "CAD Ecosystem" },
  "Parasolid": { label: "Parasolid", field: "flagParasolid", group: "CAD Ecosystem" },
  "STEP": { label: "STEP", field: "flagSTEP", group: "CAD Ecosystem" },
  "NURBS": { label: "NURBS", field: "flagNURBS", group: "CAD Ecosystem" },
  "ECAD/EDA": { label: "ECAD/EDA", field: "flagECAD", group: "CAD Ecosystem" },
  "Text-to-CAD": { label: "Text-to-CAD", field: "flagTextToCAD", group: "CAD Ecosystem" },
  "Proprietary": { label: "Proprietary", field: "flagProprietary", group: "CAD Ecosystem" },
  "FEA/FEM": { label: "FEA/FEM", field: "flagFEA", group: "Simulation" },
  "CFD": { label: "CFD", field: "flagCFD", group: "Simulation" },
  "Generative": { label: "Generative", field: "flagGenerative", group: "Modeling" },
  "Implicit": { label: "Implicit", field: "flagImplicit", group: "Modeling" },
  "HTE": { label: "HTE", field: "flagHTE", group: "Modeling" },
  "QC": { label: "QC", field: "flagQC", group: "Modeling" },
  "A&D": { label: "A&D", field: "flagAeroDefense", group: "Industry" },
  "Automotive": { label: "Automotive", field: "flagAutomotive", group: "Industry" },
  "Pharma": { label: "Pharma", field: "flagPharma", group: "Industry" },
  "MedDev": { label: "MedDev", field: "flagMedDev", group: "Industry" },
  "Process": { label: "Process", field: "flagProcess", group: "Industry" },
  "Y-Combinator": { label: "YC", field: "flagYCombinator", group: "Top VCs" },
  "a16z": { label: "a16z", field: "flagA16Z", group: "Top VCs" },
  "Techstars": { label: "Techstars", field: "flagTechstars", group: "Top VCs" },
  "Sequoia": { label: "Sequoia", field: "flagSequoia", group: "Top VCs" },
  "Insight Partners": { label: "Insight", field: "flagInsightPartners", group: "Top VCs" },
  "Eclipse Ventures": { label: "Eclipse", field: "flagEclipseVentures", group: "Top VCs" },
  "Browser-based": { label: "Browser", field: "flagBrowserBased", group: "Platform" },
}

/**
 * Red/Blue Ocean classification using the same scoring as the Maturity Matrix.
 *
 * Disruption Score = techDifferentiation * 0.6 + competitiveMoat * 0.4
 *
 * Red Ocean  — disruption < 3.0 — established, contested markets.
 *   M&A motivation: acquire customers, revenue, expertise, consulting org.
 *   Pattern: Siemens buys Mentor, Autodesk buys Moldflow.
 *
 * Blue Ocean — disruption >= 3.0 — uncontested new frontiers.
 *   M&A motivation: leverage existing tech into new domains.
 *   Pattern: Duro into Datacenters, Google Vertex as framework.
 */
export function getOceanType(company: Company): "red" | "blue" {
  const disruption = (company.techDifferentiation || 0) * 0.6 + (company.competitiveMoat || 0) * 0.4
  return disruption < 3.0 ? "red" : "blue"
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  const filterCompany = (company: Company) => {
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const matchesSearch =
        company.name.toLowerCase().includes(search) ||
        company.tags?.some(t => t.toLowerCase().includes(search))
      if (!matchesSearch) return false
    }

    if (filters.investmentLists.length > 0) {
      if (!filters.investmentLists.includes(company.investmentList)) return false
    }

    if (filters.industries.length > 0) {
      const hasIndustry = company.industriesServed?.some(ind => filters.industries.includes(ind))
      if (!hasIndustry) return false
    }

    if (filters.countries.length > 0) {
      if (!filters.countries.includes(company.country)) return false
    }

    if (filters.subsegments.length > 0) {
      if (!company.subsegment || !filters.subsegments.includes(company.subsegment)) return false
    }

    if (filters.lifecycle.length > 0) {
      const phase = company.lifecyclePhase || company.startupLifecyclePhase
      if (!phase || !filters.lifecycle.includes(phase)) return false
    }

    if (filters.fundingRound.length > 0) {
      const round = company.latestFundingRound
      if (!round || !filters.fundingRound.includes(round)) return false
    }

    if (filters.operatingModel.length > 0) {
      const hasTag = company.operatingModelTags?.some(t => filters.operatingModel.includes(t))
      if (!hasTag) return false
    }

    if (filters.categoryTags.length > 0) {
      const hasTag = company.categoryTags?.some(t => filters.categoryTags.includes(t))
      if (!hasTag) return false
    }

    if (filters.differentiationTags.length > 0) {
      const hasTag = company.differentiationTags?.some(t => filters.differentiationTags.includes(t))
      if (!hasTag) return false
    }

    if (filters.investmentTheses.length > 0) {
      const hasThesis = company.investmentTheses?.some(t => filters.investmentTheses.includes(t))
      if (!hasThesis) return false
    }

    if (filters.oceanStrategy !== "all") {
      if (getOceanType(company) !== filters.oceanStrategy) return false
    }

    if (filters.sizeCategory.length > 0) {
      if (!company.startupSizeCategory || !filters.sizeCategory.includes(company.startupSizeCategory)) return false
    }

    if (filters.ecosystemFlags.length > 0) {
      const hasFlag = filters.ecosystemFlags.some(flag => {
        const def = ECOSYSTEM_FLAGS[flag]
        return def && company[def.field] === true
      })
      if (!hasFlag) return false
    }

    if (filters.fundingRange[0] !== 0 || filters.fundingRange[1] !== 0) {
      const funding = company.totalFunding || 0
      if (funding < filters.fundingRange[0] || funding > filters.fundingRange[1]) return false
    }

    return true
  }

  return (
    <FilterContext.Provider value={{ filters, setFilters, filterCompany, isSidebarOpen: true }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilter must be used within a FilterProvider")
  }
  return context
}
