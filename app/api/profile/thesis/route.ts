import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'

const MAX_THESIS_JSON_BYTES = 32_768 // 32 KB cap on thesis config

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

  let body: { thesis_config: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { thesis_config } = body
  if (thesis_config === undefined || thesis_config === null) {
    return NextResponse.json({ error: 'thesis_config is required' }, { status: 400 })
  }

  const serialized = JSON.stringify(thesis_config)
  if (serialized.length > MAX_THESIS_JSON_BYTES) {
    return NextResponse.json({ error: 'thesis_config exceeds size limit' }, { status: 400 })
  }

  try {
    await sql`
      UPDATE profiles
      SET thesis_config = ${serialized}::jsonb
      WHERE id = ${session.user.id}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[thesis save]', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
