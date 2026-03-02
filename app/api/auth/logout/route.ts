import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, clearSessionCookie } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.json({ success: true })
    clearSessionCookie(response)

    return response
  } catch (error: unknown) {
    console.error('Logout error:', error)
    // Still clear cookie even if DB delete fails
    const response = NextResponse.json({ success: true })
    clearSessionCookie(response)
    return response
  }
}
