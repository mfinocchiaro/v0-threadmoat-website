'use server'

import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { type RegisterData, PASSWORD_RULES } from '@/lib/auth-schema'
import { rateLimit } from '@/lib/rate-limit'
import { validateCoupon, redeemCoupon } from '@/lib/coupons'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email'

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
  // --- Rate limit: 5 signups per email per 15 minutes ---
  const rl = rateLimit(`signup:${data.email.trim().toLowerCase()}`, 5, 15 * 60 * 1000)
  if (!rl.allowed) throw new Error('Too many attempts. Please try again later.')

  // --- Sanitize ---
  const fullName    = data.fullName.trim()
  const email       = data.email.trim().toLowerCase()
  const company     = data.company.trim()
  const title       = data.title.trim()
  const phone       = data.phone?.trim() || null
  const linkedinUrl = data.linkedinUrl?.trim() || null
  const inviteCode  = data.inviteCode?.trim().toUpperCase() || null
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

  // --- Validate invite code if provided ---
  let coupon = null
  if (inviteCode) {
    coupon = await validateCoupon(inviteCode)
    if (!coupon) throw new Error('Invalid or expired invite code')
  }

  // --- Check for existing account (generic message to prevent enumeration) ---
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0)
    throw new Error('Unable to create account. Please try again or sign in.')

  const passwordHash = await bcrypt.hash(password, 12)

  // --- Generate email verification token ---
  const verificationToken = crypto.randomBytes(32).toString('hex')
  const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  const [user] = await sql`
    INSERT INTO users (email, password_hash, email_verified, verification_token, verification_token_expires)
    VALUES (${email}, ${passwordHash}, false, ${verificationToken}, ${tokenExpires.toISOString()})
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

  // --- Redeem invite code if provided ---
  if (coupon) {
    await redeemCoupon(coupon.id, user.id as string, coupon.duration_days)
  }

  // --- Send verification email ---
  try {
    await sendVerificationEmail(email, verificationToken)
  } catch (err) {
    console.error('[email verification] Failed to send:', err)
    // Don't block signup if email fails — they can resend later
  }

  return { success: true }
}

export async function resendVerificationEmail(email: string) {
  const rl = rateLimit(`resend-verify:${email}`, 3, 15 * 60 * 1000)
  if (!rl.allowed) throw new Error('Too many attempts. Please try again later.')

  const rows = await sql`
    SELECT id, email_verified FROM users WHERE email = ${email.trim().toLowerCase()}
  `
  const user = rows[0]
  // Always return success to prevent enumeration
  if (!user || user.email_verified) return { success: true }

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await sql`
    UPDATE users SET verification_token = ${token}, verification_token_expires = ${expires.toISOString()}
    WHERE id = ${user.id as string}
  `

  await sendVerificationEmail(email.trim().toLowerCase(), token)
  return { success: true }
}

export async function verifyEmail(token: string) {
  const rows = await sql`
    SELECT id FROM users
    WHERE verification_token = ${token}
      AND verification_token_expires > NOW()
  `
  if (rows.length === 0) throw new Error('Invalid or expired verification link')

  await sql`
    UPDATE users
    SET email_verified = true, verification_token = NULL, verification_token_expires = NULL
    WHERE id = ${rows[0].id as string}
  `
  return { success: true }
}

export async function requestPasswordReset(email: string) {
  const rl = rateLimit(`reset:${email}`, 3, 15 * 60 * 1000)
  if (!rl.allowed) throw new Error('Too many attempts. Please try again later.')

  const normalizedEmail = email.trim().toLowerCase()
  const rows = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`

  // Always return success to prevent enumeration
  if (rows.length === 0) return { success: true }

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await sql`
    UPDATE users SET reset_token = ${token}, reset_token_expires = ${expires.toISOString()}
    WHERE id = ${rows[0].id as string}
  `

  await sendPasswordResetEmail(normalizedEmail, token)
  return { success: true }
}

export async function resetPassword(token: string, newPassword: string) {
  const passwordError = validatePassword(newPassword)
  if (passwordError) throw new Error(passwordError)

  const rows = await sql`
    SELECT id FROM users
    WHERE reset_token = ${token}
      AND reset_token_expires > NOW()
  `
  if (rows.length === 0) throw new Error('Invalid or expired reset link')

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires = NULL
    WHERE id = ${rows[0].id as string}
  `
  return { success: true }
}
