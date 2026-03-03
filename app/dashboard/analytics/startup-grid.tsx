'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowUpDown, ExternalLink, Search, X } from 'lucide-react'

type Startup = Record<string, string>

function parseFunding(s: string): number {
  if (!s) return 0
  const n = parseFloat(s.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

function formatFunding(n: number): string {
  if (n === 0) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n}`
}

function parseScore(s: string): number {
  if (!s) return 0
  const match = s.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

const COLUMNS = [
  { key: 'Company', label: 'Company' },
  { key: 'HQ Location', label: 'Location' },
  { key: 'Founded', label: 'Founded' },
  { key: 'Estimated Headcount', label: 'Headcount' },
  { key: 'Discipline', label: 'Discipline' },
  { key: 'Startup Lifecycle Phase', label: 'Stage' },
  { key: 'Latest Funding Round', label: 'Round' },
  { key: 'Total Current Known Funding Level', label: 'Total Funding' },
  { key: 'Weighted Score', label: 'Score' },
]

export function StartupGrid({ data }: { data: Startup[] }) {
  const [search, setSearch] = useState('')
  const [filterDiscipline, setFilterDiscipline] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterRound, setFilterRound] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const disciplines = useMemo(
    () => [...new Set(data.map(d => d['Discipline']).filter(Boolean))].sort(),
    [data],
  )
  const stages = useMemo(
    () => [...new Set(data.map(d => d['Startup Lifecycle Phase']).filter(Boolean))].sort(),
    [data],
  )
  const rounds = useMemo(
    () => [...new Set(data.map(d => d['Latest Funding Round']).filter(Boolean))].sort(),
    [data],
  )

  const totalFunding = useMemo(
    () => data.reduce((sum, d) => sum + parseFunding(d['Total Current Known Funding Level']), 0),
    [data],
  )
  const avgScore = useMemo(() => {
    const scores = data.map(d => parseScore(d['Weighted Score'])).filter(s => s > 0)
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  }, [data])
  const countries = useMemo(
    () => new Set(data.map(d => d['Country']).filter(Boolean)).size,
    [data],
  )

  const stageChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    data.forEach(d => {
      const r = d['Latest Funding Round']
      if (r) counts[r] = (counts[r] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))
  }, [data])

  const disciplineChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    data.forEach(d => {
      const disc = d['Discipline']
      if (disc) counts[disc] = (counts[disc] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
  }, [data])

  const filtered = useMemo(() => {
    let result = data.filter(d => {
      if (search && !d['Company']?.toLowerCase().includes(search.toLowerCase())) return false
      if (filterDiscipline && d['Discipline'] !== filterDiscipline) return false
      if (filterStage && d['Startup Lifecycle Phase'] !== filterStage) return false
      if (filterRound && d['Latest Funding Round'] !== filterRound) return false
      return true
    })
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey] || ''
        const bVal = b[sortKey] || ''
        if (sortKey === 'Total Current Known Funding Level') {
          const diff = parseFunding(aVal) - parseFunding(bVal)
          return sortDir === 'asc' ? diff : -diff
        }
        if (sortKey === 'Weighted Score') {
          const diff = parseScore(aVal) - parseScore(bVal)
          return sortDir === 'asc' ? diff : -diff
        }
        const cmp = aVal.localeCompare(bVal)
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return result
  }, [data, search, filterDiscipline, filterStage, filterRound, sortKey, sortDir])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const hasFilters = search || filterDiscipline || filterStage || filterRound

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Antigravity Build Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Industrial AI &amp; Engineering Software — Startups Grid View
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Companies" value={data.length.toLocaleString()} sub="tracked startups" />
        <StatCard title="Total Funding" value={formatFunding(totalFunding)} sub="known invested capital" />
        <StatCard
          title="Avg Weighted Score"
          value={avgScore > 0 ? avgScore.toFixed(1) : '—'}
          sub="out of 10"
        />
        <StatCard title="Countries" value={countries.toString()} sub="represented" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Companies by Funding Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stageChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Companies by Discipline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={disciplineChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary) / 0.7)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterDiscipline}
          onChange={e => setFilterDiscipline(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Disciplines</option>
          {disciplines.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Stages</option>
          {stages.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filterRound}
          onChange={e => setFilterRound(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Rounds</option>
          {rounds.map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setFilterDiscipline('')
              setFilterStage('')
              setFilterRound('')
            }}
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <strong>{filtered.length}</strong> of {data.length} companies
      </p>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className="cursor-pointer select-none whitespace-nowrap px-3 py-3 text-left font-medium hover:bg-muted/80"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">
                      {row['Company URL'] ? (
                        <a
                          href={row['Company URL']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                        >
                          {row['Company']}
                          <ExternalLink className="h-3 w-3 opacity-40" />
                        </a>
                      ) : (
                        row['Company']
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row['HQ Location'] || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row['Founded'] || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row['Estimated Headcount'] || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {row['Discipline'] && (
                        <Badge variant="secondary">{row['Discipline']}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {row['Startup Lifecycle Phase'] || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {row['Latest Funding Round'] || '—'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatFunding(parseFunding(row['Total Current Known Funding Level']))}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {row['Weighted Score'] || '—'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                      No companies match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}
