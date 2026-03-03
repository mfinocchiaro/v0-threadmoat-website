import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSession, SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const users = await sql`
      SELECT id, email, password_hash, profile_type, company_name, title
      FROM users
      WHERE email = ${email.toLowerCase()}
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    const session = await createSession(user.id)

    // Build response with Set-Cookie header
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        profileType: user.profile_type,
        companyName: user.company_name,
        title: user.title,
      },
    })

    // Explicitly set the cookie on the response
    const expires = session.expiresAt || new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: expires,
      path: '/',
    })

    return response
  } catch (error: unknown) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
