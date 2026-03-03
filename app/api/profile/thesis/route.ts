import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await sql`SELECT thesis_config FROM profiles WHERE id = ${session.user.id}`
    return NextResponse.json({ thesis_config: rows[0]?.thesis_config ?? null })
  } catch {
    return NextResponse.json({ thesis_config: null })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { thesis_config } = await req.json()
  try {
    await sql`
      UPDATE profiles
      SET thesis_config = ${JSON.stringify(thesis_config)}::jsonb
      WHERE id = ${session.user.id}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[thesis save]', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
