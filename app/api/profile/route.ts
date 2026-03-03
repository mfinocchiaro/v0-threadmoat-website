import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile_type, full_name, company, title } = await req.json()

  try {
    await sql`
      UPDATE profiles
      SET
        profile_type = ${profile_type ?? null},
        full_name    = ${full_name ?? null},
        company      = ${company ?? null},
        title        = ${title ?? null}
      WHERE id = ${session.user.id}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[profile update]', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
