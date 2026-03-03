'use server'

import { sql } from '@/lib/db'
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth'

export async function loginAction(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    // Find user by email
    const users = await sql`
      SELECT id, email, password_hash, profile_type, company_name, title
      FROM users
      WHERE email = ${email.toLowerCase()}
    `

    if (users.length === 0) {
      return { success: false, error: 'Invalid email or password' }
    }

    const user = users[0]

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Create session
    const session = await createSession(user.id)

    // Set cookie - this works in Server Actions!
    await setSessionCookie(session.token, session.expiresAt)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        profileType: user.profile_type,
        companyName: user.company_name,
        title: user.title,
      },
    }
  } catch (error: unknown) {
    console.error('Login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}
