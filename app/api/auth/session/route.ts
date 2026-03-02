import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        profileType: user.profile_type,
        companyName: user.company_name,
        title: user.title,
        isAdmin: user.is_admin,
      },
    })
  } catch (error: unknown) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
