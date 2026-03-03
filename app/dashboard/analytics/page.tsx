import fs from 'fs/promises'
import path from 'path'
import { StartupGrid } from './startup-grid'

function parseCSV(content: string): Record<string, string>[] {
  // Strip BOM if present
  const text = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content

  const rows: string[][] = []
  let currentRow: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote inside a quoted field
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        currentRow.push(field)
        field = ''
      } else if (ch === '\r') {
        // skip; \r\n is handled when \n is processed
      } else if (ch === '\n') {
        currentRow.push(field)
        field = ''
        rows.push(currentRow)
        currentRow = []
      } else {
        field += ch
      }
    }
  }

  // Flush last field/row
  if (field || currentRow.length > 0) {
    currentRow.push(field)
    rows.push(currentRow)
  }

  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.trim())

  return rows
    .slice(1)
    .filter(row => row.some(cell => cell.trim()))
    .map(cells => {
      const obj: Record<string, string> = {}
      headers.forEach((h, idx) => {
        obj[h] = (cells[idx] ?? '').trim()
      })
      return obj
    })
}

export default async function AnalyticsPage() {
  const csvPath = path.join(
    process.cwd(),
    'app',
    'dashboard',
    'analytics',
    'Startups-Grid view.csv',
  )
  const content = await fs.readFile(csvPath, 'utf-8')
  const data = parseCSV(content)

  return <StartupGrid data={data} />
}
