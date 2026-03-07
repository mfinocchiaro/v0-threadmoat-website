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

  const isAdmin = profile?.is_admin === true || adminEmails.includes(user.email || '')

  if (!isAdmin) {
    let hasSubscription = false
    try {
      const subscription = await getUserSubscription(userId)
      hasSubscription = subscription.hasActiveSubscription
    } catch {
      // DB unavailable
    }
    if (!hasSubscription) {
      return <Paywall user={user} />
    }
  }

  return (
    <DashboardLayoutClient
      user={user}
      profile={profile}
      initialScenario={profile?.profile_type}
    >
      {children}
    </DashboardLayoutClient>
  )
}
