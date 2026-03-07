import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'

async function isAdmin(userId: string, email: string): Promise<boolean> {
  const rows = await sql`SELECT is_admin FROM profiles WHERE id = ${userId}`
  if (rows[0]?.is_admin === true) return true

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
  return adminEmails.includes(email)
}

// GET /api/admin/coupons — list all coupons
export async function GET() {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!(await isAdmin(session.user.id, session.user.email))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const coupons = await sql`
    SELECT id, code, type, duration_days, max_uses, used_count, expires_at, created_by, created_at
    FROM coupons ORDER BY created_at DESC
  `
  return NextResponse.json({ coupons })
}

// POST /api/admin/coupons — create a coupon
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!(await isAdmin(session.user.id, session.user.email))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const code = (body.code as string || '').trim().toUpperCase()
  const type = body.type === 'full' ? 'full' : 'trial'
  const durationDays = Math.min(Math.max(parseInt(body.duration_days) || 30, 1), 365)
  const maxUses = Math.min(Math.max(parseInt(body.max_uses) || 1, 1), 10000)
  const expiresAt = body.expires_at ? new Date(body.expires_at).toISOString() : null

  if (!code || code.length < 3 || code.length > 50) {
    return NextResponse.json({ error: 'Code must be 3-50 characters' }, { status: 400 })
  }
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return NextResponse.json({ error: 'Code must be alphanumeric (A-Z, 0-9, _, -)' }, { status: 400 })
  }

  try {
    const [coupon] = await sql`
      INSERT INTO coupons (code, type, duration_days, max_uses, expires_at, created_by)
      VALUES (${code}, ${type}, ${durationDays}, ${maxUses}, ${expiresAt}, ${session.user.email})
      RETURNING id, code, type, duration_days, max_uses, used_count, expires_at, created_at
    `
    return NextResponse.json({ coupon }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
  }
}
