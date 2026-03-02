import { sql, type User, type ProfileType } from './db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

const SESSION_COOKIE_NAME = 'threadmoat_session'
const SESSION_DURATION_DAYS = 30

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createUser(data: {
  email: string
  password: string
  companyName?: string
  title?: string
  phone?: string
  profileType: ProfileType
}): Promise<User> {
  const passwordHash = await hashPassword(data.password)
  
  const result = await sql`
    INSERT INTO users (email, password_hash, company_name, title, phone, profile_type)
    VALUES (${data.email.toLowerCase()}, ${passwordHash}, ${data.companyName || null}, ${data.title || null}, ${data.phone || null}, ${data.profileType})
    RETURNING *
  `
  
  return result[0] as User
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email.toLowerCase()}
  `
  return result[0] as User | null
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE id = ${id}
  `
  return result[0] as User | null
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)
  
  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `
  
  // Set HTTP-only cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
  
  return token
}

export async function getSession(): Promise<{ user: User } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (!token) return null
  
  const result = await sql`
    SELECT u.* FROM users u
    JOIN sessions s ON s.user_id = u.id
    WHERE s.token = ${token} AND s.expires_at > NOW()
  `
  
  if (!result[0]) return null
  
  return { user: result[0] as User }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`
  }
  
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  return session?.user || null
}
