import React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserSubscription } from "@/lib/subscription"
import { DashboardNav } from "@/components/dashboard/nav"
import { Paywall } from "@/components/dashboard/paywall"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard")
  }

  const subscription = await getUserSubscription()

  // Show paywall if no active subscription
  if (!subscription.hasActiveSubscription) {
    return <Paywall user={user} />
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
