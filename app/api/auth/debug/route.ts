import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const sessionToken = cookieStore.get('threadmoat_session')?.value
    
    let sessionInfo = null
    if (sessionToken) {
      const result = await sql`
        SELECT s.*, u.email, u.profile_type 
        FROM sessions s 
        JOIN users u ON u.id = s.user_id 
        WHERE s.token = ${sessionToken}
      `
      sessionInfo = result[0] || null
    }
    
    return NextResponse.json({
      cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      sessionTokenExists: !!sessionToken,
      sessionInfo: sessionInfo ? {
        email: sessionInfo.email,
        profile_type: sessionInfo.profile_type,
        expires_at: sessionInfo.expires_at
      } : null
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
