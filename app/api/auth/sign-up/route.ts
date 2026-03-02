import { NextRequest, NextResponse } from 'next/server'
import { createUser, createSession, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, companyName, title, phone, profileType } = body

    // Validate required fields
    if (!email || !password || !companyName || !title || !profileType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Validate profile type
    const validProfileTypes = ['startup_founder', 'vc_pe_investor', 'oem_enterprise', 'isv_platform']
    if (!validProfileTypes.includes(profileType)) {
      return NextResponse.json(
        { error: 'Invalid profile type' },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser({
      email,
      password,
      companyName,
      title,
      phone: phone || null,
      profileType,
    })

    // Create session
    const session = await createSession(user.id)

    // Set cookie
    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email } })
    setSessionCookie(response, session.token)

    return response
  } catch (error: unknown) {
    console.error('Sign-up error:', error)
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create account' },
      { status: 500 }
    )
  }
}
