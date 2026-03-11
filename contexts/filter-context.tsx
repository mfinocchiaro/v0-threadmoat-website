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
  metrics: string
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
  metrics: "totalFunding",
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
