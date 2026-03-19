"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, ReactNode } from "react"
import { Company } from "@/lib/company-data"
import { useFilter } from "@/contexts/filter-context"

// ── Constants ──────────────────────────────────────────────

export const FUNDING_STAGES = [
  "Bootstrapped", "Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Series D+", "Growth", "Mature",
] as const

export const DEAL_SIZE_BRACKETS = [
  "<$1M", "$1-5M", "$5-20M", "$20-50M", "$50-100M", "$100M+",
] as const

export const SCORE_DIMENSIONS = [
  { key: "marketOpportunity", label: "Market Opportunity" },
  { key: "teamExecution", label: "Team & Execution" },
  { key: "techDifferentiation", label: "Tech Differentiation" },
  { key: "fundingEfficiency", label: "Funding Efficiency" },
  { key: "growthMetrics", label: "Growth Metrics" },
  { key: "industryImpact", label: "Industry Impact" },
  { key: "competitiveMoat", label: "Competitive Moat" },
] as const

export const OEM_COVERAGE_OPTIONS = ["commercial", "customized", "homegrown", "none"] as const

// ── Types ──────────────────────────────────────────────────

export type ScoreDimensionKey = (typeof SCORE_DIMENSIONS)[number]["key"]

export interface VCThesis {
  fundingStages: string[]
  fundingYearRange: [number, number]
  dealSizeBrackets: string[]
  investmentLists: string[]
  subcategories: string[]
  countries: string[]
  operatingModelTags: string[]
  categoryTags: string[]
  scoreWeights: Record<ScoreDimensionKey, number>
}

export interface ISVThesis {
  coveredInvestmentLists: string[]
  coveredLifecycles: string[]
  targetIndustries: string[]
  operatingModelTags: string[]
  targetSubcategories: string[]
  targetManufacturingTypes: string[]
  targetSectorFocus: string[]
  targetCategoryTags: string[]
}

export type OEMCoverage = "commercial" | "customized" | "homegrown" | "none"

export interface OEMThesis {
  coverageMap: Record<string, OEMCoverage>  // keyed by subcategory
}

export type ThesisType = "founder" | "vc" | "isv" | "oem"

// ── Per-profile config ─────────────────────────────────────

export interface ProfileThesisConfig {
  buttonText: string
  sheetTitle: string
  sheetDescription: string
  thesisType: ThesisType
  tabLabel: string
  indicatorLabel: string
  resultTitle: string
}

export const PROFILE_THESIS_CONFIG: Record<string, ProfileThesisConfig> = {
  startup_founder: {
    buttonText: "Set Competitive Moat",
    sheetTitle: "Competitive Moat Swimmer",
    sheetDescription: "Identify competitors and understand your positioning in the market.",
    thesisType: "founder",
    tabLabel: "Founder",
    indicatorLabel: "Competitive Moat Active",
    resultTitle: "Competitive Landscape",
  },
  vc_investor: {
    buttonText: "Set Investment Thesis",
    sheetTitle: "Investment Thesis Writer",
    sheetDescription: "Set your investment criteria to discover and rank opportunities.",
    thesisType: "vc",
    tabLabel: "Investor",
    indicatorLabel: "Investment Thesis Active",
    resultTitle: "Investment Thesis Match",
  },
  isv_platform: {
    buttonText: "Set Acquisition Radar",
    sheetTitle: "Targeted Acquisition Radar",
    sheetDescription: "Identify acquisition targets and partnership opportunities in the ecosystem.",
    thesisType: "isv",
    tabLabel: "ISV",
    indicatorLabel: "Acquisition Radar Active",
    resultTitle: "Acquisition Radar Results",
  },
  oem_enterprise: {
    buttonText: "Set White Space Analysis",
    sheetTitle: "White Space Filler",
    sheetDescription: "Map your software landscape to identify white space, gaps, and replacement opportunities.",
    thesisType: "oem",
    tabLabel: "OEM",
    indicatorLabel: "White Space Filler Active",
    resultTitle: "White Space Analysis",
  },
}

export const ADMIN_THESIS_CONFIG: ProfileThesisConfig = {
  buttonText: "Set Focus",
  sheetTitle: "Set Investment Focus",
  sheetDescription: "Define your criteria to filter and rank companies across the dashboard.",
  thesisType: "vc",
  tabLabel: "All",
  indicatorLabel: "Focus Active",
  resultTitle: "Focus Results",
}

export interface ScoredCompany {
  company: Company
  score: number
  label: string
}

interface ThesisContextType {
  activeThesis: ThesisType | null
  activeConfig: ProfileThesisConfig | null
  vcThesis: VCThesis
  isvThesis: ISVThesis
  oemThesis: OEMThesis
  applyThesis: (type: ThesisType, drafts?: { vc?: VCThesis; isv?: ISVThesis; oem?: OEMThesis }) => void
  clearThesis: () => void
  setVCThesis: React.Dispatch<React.SetStateAction<VCThesis>>
  setISVThesis: React.Dispatch<React.SetStateAction<ISVThesis>>
  setOEMThesis: React.Dispatch<React.SetStateAction<OEMThesis>>
  scoredCompanies: ScoredCompany[]
  scoreCompanies: (companies: Company[]) => ScoredCompany[]
  profileType?: string
}

// ── Defaults ───────────────────────────────────────────────

const DEFAULT_SCORE_WEIGHTS: Record<ScoreDimensionKey, number> = {
  marketOpportunity: 4,
  teamExecution: 4,
  techDifferentiation: 4,
  fundingEfficiency: 4,
  growthMetrics: 4,
  industryImpact: 4,
  competitiveMoat: 4,
}

const DEFAULT_VC: VCThesis = {
  fundingStages: [],
  fundingYearRange: [0, 0],
  dealSizeBrackets: [],
  investmentLists: [],
  subcategories: [],
  countries: [],
  operatingModelTags: [],
  categoryTags: [],
  scoreWeights: { ...DEFAULT_SCORE_WEIGHTS },
}

const DEFAULT_ISV: ISVThesis = {
  coveredInvestmentLists: [],
  coveredLifecycles: [],
  targetIndustries: [],
  operatingModelTags: [],
  targetSubcategories: [],
  targetManufacturingTypes: [],
  targetSectorFocus: [],
  targetCategoryTags: [],
}

const DEFAULT_OEM: OEMThesis = {
  coverageMap: {},
}

// ── Scoring helpers ────────────────────────────────────────

function dealSizeMatch(amount: number, brackets: string[]): boolean {
  if (brackets.length === 0) return true
  for (const b of brackets) {
    if (b === "<$1M" && amount < 1_000_000) return true
    if (b === "$1-5M" && amount >= 1_000_000 && amount < 5_000_000) return true
    if (b === "$5-20M" && amount >= 5_000_000 && amount < 20_000_000) return true
    if (b === "$20-50M" && amount >= 20_000_000 && amount < 50_000_000) return true
    if (b === "$50-100M" && amount >= 50_000_000 && amount < 100_000_000) return true
    if (b === "$100M+" && amount >= 100_000_000) return true
  }
  return false
}

function scoreVC(company: Company, thesis: VCThesis): number {
  let score = 0

  // ── Investment List match (25pts) — HARD FILTER when set ──
  const lists = thesis.investmentLists ?? []
  if (lists.length === 0) {
    score += 25
  } else if (lists.includes(company.investmentList)) {
    score += 25
  } else {
    return 0 // Company is outside the selected investment lists — exclude entirely
  }

  // ── Subcategory match (15pts) — HARD FILTER when set ──
  const subcats = thesis.subcategories ?? []
  if (subcats.length === 0) {
    score += 15
  } else if (company.subcategories && subcats.includes(company.subcategories)) {
    score += 15
  } else {
    return 0 // Company is outside the selected subcategories — exclude entirely
  }

  // ── Stage match (10pts) ──
  const stages = thesis.fundingStages ?? []
  if (stages.length === 0) {
    score += 10
  } else {
    const round = company.latestFundingRound || company.startupLifecyclePhase || ""
    if (stages.some(s => round.toLowerCase().includes(s.toLowerCase()))) score += 10
  }

  // ── Last funding year (5pts) ──
  const [yearMin, yearMax] = thesis.fundingYearRange ?? [0, 0]
  if (yearMin === 0 && yearMax === 0) {
    score += 5
  } else {
    const fy = company.fundingYear || 0
    if (fy >= yearMin && fy <= yearMax) score += 5
  }

  // ── Operating model match (10pts) ──
  const opTags = thesis.operatingModelTags ?? []
  if (opTags.length === 0) {
    score += 10
  } else {
    const companyOps = company.operatingModelTags || []
    if (opTags.some(t => companyOps.some(ct => ct.toLowerCase() === t.toLowerCase()))) score += 10
  }

  // ── Category/function tags match (10pts) ──
  const catTags = thesis.categoryTags ?? []
  if (catTags.length === 0) {
    score += 10
  } else {
    const companyCats = company.categoryTags || []
    if (catTags.some(t => companyCats.some(ct => ct.toLowerCase() === t.toLowerCase()))) score += 10
  }

  // ── Geography (5pts) ──
  const countries = thesis.countries ?? []
  if (countries.length === 0) {
    score += 5
  } else {
    if (countries.includes(company.country)) score += 5
  }

  // ── Weighted dimension scores (20pts) ──
  const weights = thesis.scoreWeights ?? {}
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  if (totalWeight > 0) {
    let weightedSum = 0
    for (const dim of SCORE_DIMENSIONS) {
      const companyVal = (company[dim.key as keyof Company] as number) || 0
      const weight = Math.min(weights[dim.key] ?? 4, 5)
      weightedSum += (companyVal / 5) * (weight / 5)
    }
    score += (weightedSum / SCORE_DIMENSIONS.length) * 20
  } else {
    score += 20
  }

  return Math.min(Math.round(score), 100)
}

function scoreISV(company: Company, thesis: ISVThesis): { score: number; label: string } {
  // Need at least one covered investment list to define what the ISV already owns
  if (thesis.coveredInvestmentLists.length === 0) {
    return { score: 0, label: "Filtered Out" }
  }

  // ── Is this company in the ISV's existing coverage? ──
  const inCoveredList = thesis.coveredInvestmentLists.includes(company.investmentList)

  const phase = company.lifecyclePhase || company.startupLifecyclePhase || ""
  const inCoveredLifecycle = thesis.coveredLifecycles.length === 0
    || thesis.coveredLifecycles.includes(phase)

  // Company is in ISV's existing investment list coverage
  if (inCoveredList) {
    if (inCoveredLifecycle) return { score: 20, label: "Covered" }
    return { score: 60, label: "Adjacent" }
  }

  // ── Company is NOT in covered lists → evaluate as acquisition target ──
  // Apply hard filters first — each narrows the pool

  // Subcategory filter (hard gate)
  const targetSubs = thesis.targetSubcategories ?? []
  if (targetSubs.length > 0 && !targetSubs.includes(company.subcategories)) {
    return { score: 0, label: "Filtered Out" }
  }

  // Manufacturing type filter (hard gate)
  const targetMfg = thesis.targetManufacturingTypes ?? []
  if (targetMfg.length > 0) {
    const companyMfg = company.manufacturingType || ""
    if (!targetMfg.some(t => companyMfg.toLowerCase().includes(t.toLowerCase()))) {
      return { score: 0, label: "Filtered Out" }
    }
  }

  // Sector focus filter (hard gate)
  const targetSectors = thesis.targetSectorFocus ?? []
  if (targetSectors.length > 0) {
    const companySector = company.sectorFocus || ""
    if (!targetSectors.includes(companySector)) {
      return { score: 0, label: "Filtered Out" }
    }
  }

  // Category/function tags filter (hard gate — must match at least one)
  const targetCatTags = thesis.targetCategoryTags ?? []
  if (targetCatTags.length > 0) {
    const companyCats = company.categoryTags || []
    if (!targetCatTags.some(t => companyCats.some(ct => ct.toLowerCase() === t.toLowerCase()))) {
      return { score: 0, label: "Filtered Out" }
    }
  }

  // ── Soft scoring within the filtered pool ──
  const hasTargetIndustries = thesis.targetIndustries.length > 0
  const hasOperatingModel = (thesis.operatingModelTags || []).length > 0

  const matchesTargetIndustry = hasTargetIndustries
    && (company.industriesServed || []).some(ind => thesis.targetIndustries.includes(ind))

  const matchesOperatingModel = hasOperatingModel
    && (company.operatingModelTags || []).some(t =>
      (thesis.operatingModelTags || []).some(tt => t.toLowerCase() === tt.toLowerCase())
    )

  // No soft targeting criteria set → company passed all hard filters, it's whitespace
  if (!hasTargetIndustries && !hasOperatingModel) {
    return { score: 80, label: "Whitespace" }
  }

  // With soft targeting, score based on matches
  const bothSet = hasTargetIndustries && hasOperatingModel
  if (bothSet && matchesTargetIndustry && matchesOperatingModel) {
    return { score: 100, label: "Whitespace" }
  }
  if (bothSet && (matchesTargetIndustry || matchesOperatingModel)) {
    return { score: 60, label: "Adjacent" }
  }
  if (!bothSet && (matchesTargetIndustry || matchesOperatingModel)) {
    return { score: 100, label: "Whitespace" }
  }

  // Has soft targeting but no match → filtered out
  return { score: 0, label: "Filtered Out" }
}

function scoreOEM(company: Company, thesis: OEMThesis): { score: number; label: string } {
  // Need at least one entry in the coverage map to activate scoring
  if (Object.keys(thesis.coverageMap).length === 0) {
    return { score: 0, label: "Filtered Out" }
  }

  // Match on subcategory first, fall back to investment list for legacy configs
  const coverage = thesis.coverageMap[company.subcategories] ?? thesis.coverageMap[company.investmentList]

  // undefined = subcategory not in map = user didn't configure this area
  // Once the user has set up ANY coverage, unconfigured areas are real gaps
  if (coverage === undefined || coverage === "none") {
    return { score: 80, label: "Coverage Gap" }
  }
  if (coverage === "customized" || coverage === "homegrown") {
    return { score: 100, label: "Replacement Candidate" }
  }
  // "commercial" = covered by vendor software, low priority
  return { score: 20, label: "Commercial" }
}

// ── Context ────────────────────────────────────────────────

const ThesisContext = createContext<ThesisContextType | undefined>(undefined)

// ── Persistence helpers ────────────────────────────────────

interface SavedThesis {
  activeThesis: ThesisType | null
  vc: VCThesis
  isv: ISVThesis
  oem: OEMThesis
}

function saveThesisToAPI(data: SavedThesis) {
  fetch("/api/profile/thesis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thesis_config: data }),
  }).catch(() => {})
}

export function ThesisProvider({ children, profileType }: { children: ReactNode; profileType?: string }) {
  const { setFilters } = useFilter()
  const [activeThesis, setActiveThesis] = useState<ThesisType | null>(null)
  const [vcThesis, setVCThesis] = useState<VCThesis>(DEFAULT_VC)
  const [isvThesis, setISVThesis] = useState<ISVThesis>(DEFAULT_ISV)
  const [oemThesis, setOEMThesis] = useState<OEMThesis>(DEFAULT_OEM)
  const [scoredCompanies, setScoredCompanies] = useState<ScoredCompany[]>([])
  const loaded = useRef(false)

  // Load saved thesis on mount
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    fetch("/api/profile/thesis")
      .then(r => r.json())
      .then(({ thesis_config }) => {
        if (!thesis_config) return
        const saved = thesis_config as SavedThesis
        if (saved.vc) setVCThesis(saved.vc)
        if (saved.isv) setISVThesis(saved.isv)
        if (saved.oem) setOEMThesis(saved.oem)
        if (saved.activeThesis) {
          // Only activate saved thesis if it matches the current profile type
          // (prevents ISV thesis leaking into OEM view, etc.)
          const expectedType = profileType ? PROFILE_THESIS_CONFIG[profileType]?.thesisType : null
          const vcFamily: ThesisType[] = ["vc", "founder"]
          const thesisMatchesProfile = !expectedType
            || saved.activeThesis === expectedType
            || (vcFamily.includes(saved.activeThesis) && vcFamily.includes(expectedType))
          if (thesisMatchesProfile) {
            setActiveThesis(saved.activeThesis)
            // Re-apply filters
            setTimeout(() => {
              const vc = saved.vc ?? DEFAULT_VC
              setFilters(prev => {
                const next = { ...prev }
                switch (saved.activeThesis) {
                  case "founder":
                  case "vc":
                    if (vc.investmentLists.length > 0) next.investmentLists = vc.investmentLists
                    if (vc.countries.length > 0) next.countries = vc.countries
                    if (vc.fundingStages.length > 0) next.fundingRound = vc.fundingStages
                    break
                  case "oem":
                    // OEM coverage is now subcategory-keyed; no investment list filter push
                    break
                }
                return next
              })
            }, 0)
          }
        }
      })
      .catch(() => {})
  }, [setFilters, profileType])

  const scoreCompanies = useCallback((companies: Company[]): ScoredCompany[] => {
    if (!activeThesis) return []

    let results: ScoredCompany[]
    switch (activeThesis) {
      case "founder":
      case "vc":
        results = companies.map(c => ({
          company: c,
          score: scoreVC(c, vcThesis),
          label: `${scoreVC(c, vcThesis)}%`,
        }))
        break
      case "isv":
        results = companies.map(c => {
          const { score, label } = scoreISV(c, isvThesis)
          return { company: c, score, label }
        })
        break
      case "oem":
        results = companies.map(c => {
          const { score, label } = scoreOEM(c, oemThesis)
          return { company: c, score, label }
        })
        break
    }

    return results.sort((a, b) => b.score - a.score)
  }, [activeThesis, vcThesis, isvThesis, oemThesis])

  const applyThesis = useCallback((type: ThesisType, drafts?: { vc?: VCThesis; isv?: ISVThesis; oem?: OEMThesis }) => {
    // Apply drafts first if provided (from panel)
    const vc = drafts?.vc ?? vcThesis
    const isv = drafts?.isv ?? isvThesis
    const oem = drafts?.oem ?? oemThesis
    if (drafts?.vc) setVCThesis(drafts.vc)
    if (drafts?.isv) setISVThesis(drafts.isv)
    if (drafts?.oem) setOEMThesis(drafts.oem)

    setActiveThesis(type)
    saveThesisToAPI({ activeThesis: type, vc, isv, oem })

    // Push relevant filters into FilterContext
    setFilters(prev => {
      const next = { ...prev }
      switch (type) {
        case "founder":
        case "vc":
          if (vc.investmentLists.length > 0) next.investmentLists = vc.investmentLists
          if (vc.countries.length > 0) next.countries = vc.countries
          if (vc.fundingStages.length > 0) next.fundingRound = vc.fundingStages
          break
        case "isv":
          // ISV doesn't push filters — it scores based on what's NOT covered
          break
        case "oem":
          // OEM coverage is subcategory-keyed; scoring handles filtering
          break
      }
      return next
    })
  }, [vcThesis, isvThesis, oemThesis, setFilters])

  const clearThesis = useCallback(() => {
    setActiveThesis(null)
    setScoredCompanies([])
    saveThesisToAPI({ activeThesis: null, vc: vcThesis, isv: isvThesis, oem: oemThesis })
    setFilters({
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
      oceanStrategy: "all",
      sizeCategory: [],
      ecosystemFlags: [],
    })
  }, [setFilters])

  const activeConfig = useMemo<ProfileThesisConfig | null>(() => {
    if (!activeThesis) return null
    // Find config by matching thesisType — prefer the current profileType's config
    if (profileType && PROFILE_THESIS_CONFIG[profileType]?.thesisType === activeThesis) {
      return PROFILE_THESIS_CONFIG[profileType]
    }
    // Fallback: find any config with this thesis type
    const entry = Object.values(PROFILE_THESIS_CONFIG).find(c => c.thesisType === activeThesis)
    return entry ?? ADMIN_THESIS_CONFIG
  }, [activeThesis, profileType])

  const value = useMemo(() => ({
    activeThesis,
    activeConfig,
    vcThesis,
    isvThesis,
    oemThesis,
    applyThesis,
    clearThesis,
    setVCThesis,
    setISVThesis,
    setOEMThesis,
    scoredCompanies,
    scoreCompanies,
    profileType,
  }), [activeThesis, activeConfig, vcThesis, isvThesis, oemThesis, applyThesis, clearThesis, scoredCompanies, scoreCompanies, profileType])

  return (
    <ThesisContext.Provider value={value}>
      {children}
    </ThesisContext.Provider>
  )
}

export function useThesis() {
  const context = useContext(ThesisContext)
  if (context === undefined) {
    throw new Error("useThesis must be used within a ThesisProvider")
  }
  return context
}

export function useThesisOptional() {
  return useContext(ThesisContext) ?? null
}
