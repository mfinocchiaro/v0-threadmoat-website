import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import { z } from 'zod'

const ProfileUpdateSchema = z.object({
  profile_type: z.enum(['startup_founder', 'vc_investor', 'oem_enterprise', 'isv_platform']).nullable().optional(),
  full_name: z.string().max(100).nullable().optional(),
  company: z.string().max(100).nullable().optional(),
  title: z.string().max(100).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let data: z.infer<typeof ProfileUpdateSchema>
  try {
    data = ProfileUpdateSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { profile_type, full_name, company, title } = data

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
