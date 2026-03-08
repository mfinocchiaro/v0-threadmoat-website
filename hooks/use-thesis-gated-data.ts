"use client"

import { useEffect, useState, useMemo } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { useFilter } from "@/contexts/filter-context"
import { useThesis } from "@/contexts/thesis-context"

export function useThesisGatedData() {
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { filterCompany } = useFilter()
  const { activeThesis, scoreCompanies } = useThesis()

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

  return { companies: displayData, filtered, isLoading, hasThesis, allCompanies }
}
