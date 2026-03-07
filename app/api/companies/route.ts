import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { loadCompaniesFromCSV } from '@/lib/load-companies-server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const companies = await loadCompaniesFromCSV()
    return NextResponse.json({ success: true, count: companies.length, data: companies })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load company data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
