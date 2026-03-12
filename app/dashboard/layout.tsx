import React from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import { getUserSubscription } from '@/lib/subscription'
import { DashboardLayoutClient } from '@/components/dashboard/layout-client'
import { Paywall } from '@/components/dashboard/paywall'

type ProfileRow = {
  is_admin?: boolean
  full_name?: string
  company?: string
  title?: string
  profile_type?: string
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login?redirect=/dashboard')
  }

  const user = session.user
  const userId: string = user.id!

  let profile: ProfileRow | undefined
  try {
    const rows = await sql`
      SELECT is_admin, full_name, company, title, profile_type
      FROM profiles
      WHERE id = ${userId}
    `
    profile = rows[0] as ProfileRow | undefined
  } catch {
    // DB unavailable — fall through to ADMIN_EMAILS check below
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)

  // Match exact email or Gmail +alias (e.g. user+tag@gmail.com matches user@gmail.com)
  const userEmail = user.email || ''
  const baseEmail = userEmail.replace(/\+[^@]*@/, '@')
  const isAdmin = profile?.is_admin === true
    || adminEmails.includes(userEmail)
    || adminEmails.includes(baseEmail)

  let hasSubscription = false
  let isExpiredTrial = false
  let daysRemaining: number | null = null
  if (!isAdmin) {
    try {
      const subscription = await getUserSubscription(userId)
      hasSubscription = subscription.hasActiveSubscription
      isExpiredTrial = subscription.isExpiredTrial
      daysRemaining = subscription.daysRemaining
    } catch {
      // DB unavailable
    }
  } else {
    hasSubscription = true
  }

  // Free users get the dashboard chrome (sidebar, topbar) but only access free pages
  // Paid pages show an inline upgrade prompt via FreeUserGuard
  const isFreeUser = !isAdmin && !hasSubscription

  return (
    <DashboardLayoutClient
      user={user}
      profile={profile}
      initialScenario={profile?.profile_type}
      isAdmin={isAdmin}
      isFreeUser={isFreeUser}
      isExpiredTrial={isExpiredTrial}
      daysRemaining={daysRemaining}
    >
      {children}
    </DashboardLayoutClient>
  )
}
