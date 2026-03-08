'use server'

import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { PASSWORD_RULES } from '@/lib/auth-schema'
import type { RegisterData } from '@/lib/auth-schema'
import { rateLimit } from '@/lib/rate-limit'
import { validateCoupon, redeemCoupon } from '@/lib/coupons'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email'

type ActionResult = { success: true } | { success: false; error: string }

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

export async function registerUser(data: RegisterData): Promise<ActionResult> {
  try {
    // --- Rate limit: 5 signups per email per 15 minutes ---
    const rl = await rateLimit(`signup:${data.email.trim().toLowerCase()}`, 5, 15 * 60 * 1000)
    if (!rl.allowed) return { success: false, error: 'Too many attempts. Please try again later.' }

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
      return { success: false, error: 'Full name must be between 1 and 100 characters' }
    if (!company || company.length > 100)
      return { success: false, error: 'Company must be between 1 and 100 characters' }
    if (!title || title.length > 100)
      return { success: false, error: 'Title must be between 1 and 100 characters' }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { success: false, error: 'Invalid email address' }
    if (phone && phone.length > 30)
      return { success: false, error: 'Phone number is too long' }

    // --- Validate enums (runtime guard against direct API calls) ---
    if (!VALID_PROFILE_TYPES.has(profileType))
      return { success: false, error: 'Invalid profile type' }
    if (companySize && !VALID_COMPANY_SIZES.has(companySize))
      return { success: false, error: 'Invalid company size' }

    // --- Validate LinkedIn URL ---
    if (linkedinUrl && !validateLinkedInUrl(linkedinUrl))
      return { success: false, error: 'LinkedIn URL must start with https://linkedin.com/' }

    // --- Validate password strength ---
    const passwordError = validatePassword(password)
    if (passwordError) return { success: false, error: passwordError }

    // --- Validate invite code if provided ---
    let coupon = null
    if (inviteCode && inviteCode.length > 0) {
      coupon = await validateCoupon(inviteCode)
      if (!coupon) return { success: false, error: 'Invalid or expired invite code' }
    }

    // --- Check for existing account ---
    const existing = await sql`SELECT id, email_verified FROM users WHERE email = ${email}`
    if (existing.length > 0) {
      if (existing[0].email_verified) {
        // Verified account exists — generic message to prevent enumeration
        return { success: false, error: 'Unable to create account. Please try again or sign in.' }
      }
      // Unverified account from a failed previous attempt — clean it up so they can retry
      await sql`DELETE FROM users WHERE id = ${existing[0].id as string}`
    }

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
    }

    return { success: true }
  } catch (err) {
    console.error('[registerUser]', err)
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Registration failed: ${msg}` }
  }
}

export async function resendVerificationEmail(email: string): Promise<ActionResult> {
  try {
    const rl = await rateLimit(`resend-verify:${email}`, 3, 15 * 60 * 1000)
    if (!rl.allowed) return { success: false, error: 'Too many attempts. Please try again later.' }

    const rows = await sql`
      SELECT id, email_verified FROM users WHERE email = ${email.trim().toLowerCase()}
    `
    const user = rows[0]
    if (!user || user.email_verified) return { success: true }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await sql`
      UPDATE users SET verification_token = ${token}, verification_token_expires = ${expires.toISOString()}
      WHERE id = ${user.id as string}
    `

    await sendVerificationEmail(email.trim().toLowerCase(), token)
    return { success: true }
  } catch (err) {
    console.error('[resendVerificationEmail]', err)
    return { success: false, error: 'Failed to resend. Please try again.' }
  }
}

export async function verifyEmail(token: string): Promise<ActionResult> {
  try {
    const rows = await sql`
      SELECT id FROM users
      WHERE verification_token = ${token}
        AND verification_token_expires > NOW()
    `
    if (rows.length === 0) return { success: false, error: 'Invalid or expired verification link' }

    await sql`
      UPDATE users
      SET email_verified = true, verification_token = NULL, verification_token_expires = NULL
      WHERE id = ${rows[0].id as string}
    `
    return { success: true }
  } catch (err) {
    console.error('[verifyEmail]', err)
    return { success: false, error: 'Verification failed. Please try again.' }
  }
}

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  try {
    const rl = await rateLimit(`reset:${email}`, 3, 15 * 60 * 1000)
    if (!rl.allowed) return { success: false, error: 'Too many attempts. Please try again later.' }

    const normalizedEmail = email.trim().toLowerCase()
    const rows = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`

    if (rows.length === 0) return { success: true }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await sql`
      UPDATE users SET reset_token = ${token}, reset_token_expires = ${expires.toISOString()}
      WHERE id = ${rows[0].id as string}
    `

    await sendPasswordResetEmail(normalizedEmail, token)
    return { success: true }
  } catch (err) {
    console.error('[requestPasswordReset]', err)
    return { success: false, error: 'Failed to send reset email. Please try again.' }
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<ActionResult> {
  try {
    const passwordError = validatePassword(newPassword)
    if (passwordError) return { success: false, error: passwordError }

    const rows = await sql`
      SELECT id FROM users
      WHERE reset_token = ${token}
        AND reset_token_expires > NOW()
    `
    if (rows.length === 0) return { success: false, error: 'Invalid or expired reset link' }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires = NULL
      WHERE id = ${rows[0].id as string}
    `
    return { success: true }
  } catch (err) {
    console.error('[resetPassword]', err)
    return { success: false, error: 'Password reset failed. Please try again.' }
  }
}
