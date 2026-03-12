import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import Papa from 'papaparse'
import { promises as fs } from 'fs'
import path from 'path'
import { rateLimit } from '@/lib/rate-limit'
import { INVESTOR_META } from '@/lib/investor-meta'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await rateLimit(`api:investors:${session.user.id}`, 30, 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    // Build startup name → investment list lookup from Startups CSV
    const startupCsvPath = path.join(process.cwd(), 'data', 'Startups-Grid view.csv')
    let startupCsv = await fs.readFile(startupCsvPath, 'utf-8')
    if (startupCsv.charCodeAt(0) === 0xFEFF) startupCsv = startupCsv.slice(1)
    const startupParsed = Papa.parse(startupCsv, { header: true, skipEmptyLines: true })
    const startupInvestmentMap: Record<string, string> = {}
    for (const row of startupParsed.data as Record<string, string>[]) {
      const name = (row['Company'] || '').trim()
      const list = (row['Investment List'] || '').trim()
      if (name && list) startupInvestmentMap[name] = list
    }

    const csvPath = path.join(process.cwd(), 'data', 'Investors-Grid view.csv')
    let csvContent = await fs.readFile(csvPath, 'utf-8')

    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1)
    }

    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
    const rawData = parsed.data as Record<string, string>[]

    const EXCLUDED = ['undisclosed angel investors', 'bootstrapped', 'unknown', 'n/a', 'n a']

    // Simple comma-separated parser for fields without internal commas (company names)
    function parseNestedCsv(field: string): string[] {
      if (!field) return []
      const result = Papa.parse(field, { header: false })
      const values = (result.data[0] as string[] || []).map(s => s.trim()).filter(Boolean)
      return Array.from(new Set(values))
    }

    // Investment Lists contain commas inside parentheses, e.g.:
    // "Factory Futures (MES, IIOT), Streamlined Supply Chain (SCM)"
    // PapaParse splits on inner commas, so we recombine fragments.
    // Each valid entry has balanced parentheses: "Name (ABBR, ABBR)"
    function parseInvestmentLists(field: string): string[] {
      if (!field) return []
      const result = Papa.parse(field, { header: false })
      const fragments = (result.data[0] as string[] || []).map(s => s.trim()).filter(Boolean)
      const merged: string[] = []
      let current = ''
      for (const frag of fragments) {
        if (current) {
          current += ', ' + frag
        } else {
          current = frag
        }
        // A complete entry has balanced parens or no parens at all
        const opens = (current.match(/\(/g) || []).length
        const closes = (current.match(/\)/g) || []).length
        if (opens === closes) {
          merged.push(current)
          current = ''
        }
      }
      if (current) merged.push(current) // flush remainder
      return Array.from(new Set(merged))
    }

    const investors = rawData
      .filter(row => {
        const name = (row['Name (Institution or Individual)'] || '').trim()
        return name && !EXCLUDED.includes(name.toLowerCase())
      })
      .map((row, i) => ({
        id: String(i + 1),
        name: (row['Name (Institution or Individual)'] || '').trim(),
        startupNames: parseNestedCsv(row['Company (from Associated Startups)'] || ''),
        startupCount: parseInt(row['Startup Count']) || 0,
        investmentLists: parseInvestmentLists(row['Investment Lists'] || ''),
        linkedInProfile: (row['LinkedIn Profile'] || '').trim(),
        email: (row['Email'] || '').trim(),
        notes: (row['Notes'] || '').trim(),
        contacts: (row['Contacts'] || '').trim(),
        investorType: (row['Investor Type'] || '').trim(),
        hq: '',
        description: '',
      }))
      .map(inv => {
        const meta = INVESTOR_META[inv.name]
        if (meta) {
          inv.hq = meta.hq
          inv.description = meta.description
        }
        return inv
      })

    return NextResponse.json({ success: true, count: investors.length, data: investors, startupInvestmentMap })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load investor data' },
      { status: 500 }
    )
  }
}
