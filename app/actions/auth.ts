'use server'

import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { type RegisterData, PASSWORD_RULES } from '@/lib/auth-schema'
import { rateLimit } from '@/lib/rate-limit'

export type { RegisterData }

const VALID_PROFILE_TYPES = new Set([
  'startup_founder', 'vc_investor', 'oem_enterprise', 'isv_platform',
])
const VALID_COMPANY_SIZES = new Set(['1-10', '11-50', '51-200', '201-500', '500+'])

function validatePassword(password: string): string | null {
  for (const rule of Object.values(PASSWORD_RULES)) {
    if (!rule.test(password)) return `Password must contain: ${rule.label.toLowerCase()}`
  }
  return null
}

function validateLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'linkedin.com' || parsed.hostname === 'www.linkedin.com')
    )
  } catch {
    return false
  }
}

export async function registerUser(data: RegisterData) {
  // --- Rate limit: 5 signups per IP-like key per 15 minutes ---
  const rl = rateLimit(`signup:${data.email.trim().toLowerCase()}`, 5, 15 * 60 * 1000)
  if (!rl.allowed) throw new Error('Too many attempts. Please try again later.')

  // --- Sanitize ---
  const fullName    = data.fullName.trim()
  const email       = data.email.trim().toLowerCase()
  const company     = data.company.trim()
  const title       = data.title.trim()
  const phone       = data.phone?.trim() || null
  const linkedinUrl = data.linkedinUrl?.trim() || null
  const { password, profileType, companySize } = data

  // --- Validate lengths ---
  if (!fullName || fullName.length > 100)
    throw new Error('Full name must be between 1 and 100 characters')
  if (!company || company.length > 100)
    throw new Error('Company must be between 1 and 100 characters')
  if (!title || title.length > 100)
    throw new Error('Title must be between 1 and 100 characters')
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Invalid email address')
  if (phone && phone.length > 30)
    throw new Error('Phone number is too long')

  // --- Validate enums (runtime guard against direct API calls) ---
  if (!VALID_PROFILE_TYPES.has(profileType))
    throw new Error('Invalid profile type')
  if (companySize && !VALID_COMPANY_SIZES.has(companySize))
    throw new Error('Invalid company size')

  // --- Validate LinkedIn URL ---
  if (linkedinUrl && !validateLinkedInUrl(linkedinUrl))
    throw new Error('LinkedIn URL must start with https://linkedin.com/')

  // --- Validate password strength ---
  const passwordError = validatePassword(password)
  if (passwordError) throw new Error(passwordError)

  // --- Check for existing account (generic message to prevent enumeration) ---
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0)
    throw new Error('Unable to create account. Please try again or sign in.')

  const passwordHash = await bcrypt.hash(password, 12)

  const [user] = await sql`
    INSERT INTO users (email, password_hash)
    VALUES (${email}, ${passwordHash})
    RETURNING id
  `

  await sql`
    INSERT INTO profiles (id, full_name, company, title, profile_type, phone, linkedin_url, company_size)
    VALUES (
      ${user.id as string},
      ${fullName},
      ${company},
      ${title},
      ${profileType},
      ${phone},
      ${linkedinUrl},
      ${companySize ?? null}
    )
  `

  return { success: true }
}
