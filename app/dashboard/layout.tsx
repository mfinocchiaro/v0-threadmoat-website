import React from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import { getUserSubscription } from '@/lib/subscription'
import { DashboardNav } from '@/components/dashboard/nav'
import { Paywall } from '@/components/dashboard/paywall'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?redirect=/dashboard')
  }

  const user = session.user

  // Check if user is an admin (bypasses paywall)
  // Also supports ADMIN_EMAILS env var as a fallback for dev/testing
  const rows = await sql`SELECT is_admin FROM profiles WHERE id = ${user.id}`
  const profile = rows[0]

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)

  const isAdmin = profile?.is_admin === true || adminEmails.includes(user.email || '')

  if (!isAdmin) {
    const subscription = await getUserSubscription(user.id)
    if (!subscription.hasActiveSubscription) {
      return <Paywall user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
