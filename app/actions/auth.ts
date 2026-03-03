'use server'

import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function registerUser(email: string, password: string) {
  // Check for existing account
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) {
    throw new Error('An account with this email already exists')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const [user] = await sql`
    INSERT INTO users (email, password_hash)
    VALUES (${email}, ${passwordHash})
    RETURNING id
  `

  // Create profile row for this user
  await sql`INSERT INTO profiles (id) VALUES (${user.id as string})`

  return { success: true }
}
