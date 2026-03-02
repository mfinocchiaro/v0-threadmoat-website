import { createClient } from "@/lib/supabase/server"

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "none"

export interface UserSubscription {
  hasActiveSubscription: boolean
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
}

export async function getUserSubscription(): Promise<UserSubscription> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      hasActiveSubscription: false,
      status: "none",
      currentPeriodEnd: null,
    }
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!subscription) {
    return {
      hasActiveSubscription: false,
      status: "none",
      currentPeriodEnd: null,
    }
  }

  const activeStatuses: SubscriptionStatus[] = ["active", "trialing"]
  
  return {
    hasActiveSubscription: activeStatuses.includes(subscription.status as SubscriptionStatus),
    status: subscription.status as SubscriptionStatus,
    currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : null,
  }
}

export async function getUserProfile() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return profile
}
