"use client"

import { useEffect, useState, useMemo } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { useFilter } from "@/contexts/filter-context"
import { useThesis } from "@/contexts/thesis-context"
import { usePlan } from "@/contexts/plan-context"
import { maskCompanies } from "@/lib/name-masking"

export function useThesisGatedData() {
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { filterCompany } = useFilter()
  const { activeThesis, scoreCompanies } = useThesis()
  const { accessTier } = usePlan()

  useEffect(() => {
    loadCompanyData().then(data => { setAllCompanies(data); setIsLoading(false) })
  }, [])

  const hasThesis = !!activeThesis

  const displayData = useMemo(() => {
    if (!hasThesis) return allCompanies // Show all data when no thesis
    const scored = scoreCompanies(allCompanies)
    return scored.filter(r => r.score >= 50).map(r => r.company)
  }, [hasThesis, scoreCompanies, allCompanies])

  const filtered = useMemo(
    () => displayData.filter(filterCompany),
    [displayData, filterCompany]
  )

  // Mask company names for Analyst tier (Strategist + Admin see real names)
  const maskedFiltered = useMemo(
    () => maskCompanies(filtered, accessTier),
    [filtered, accessTier]
  )

  const maskedCompanies = useMemo(
    () => maskCompanies(displayData, accessTier),
    [displayData, accessTier]
  )

  return {
    companies: maskedCompanies,
    filtered: maskedFiltered,
    isLoading,
    hasThesis,
    allCompanies,
    // Unmasked versions for filter bar (needs real names for filtering)
    rawCompanies: displayData,
    rawFiltered: filtered,
  }
}
