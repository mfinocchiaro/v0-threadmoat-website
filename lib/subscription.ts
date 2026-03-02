import { sql } from "@/lib/db"

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "none"

export interface UserSubscription {
  hasActiveSubscription: boolean
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  if (!userId) {
    return {
      hasActiveSubscription: false,
      status: "none",
      currentPeriodEnd: null,
    }
  }

  const subscriptions = await sql`
    SELECT * FROM subscriptions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `

  if (subscriptions.length === 0) {
    return {
      hasActiveSubscription: false,
      status: "none",
      currentPeriodEnd: null,
    }
  }

  const subscription = subscriptions[0]
  const activeStatuses: SubscriptionStatus[] = ["active", "trialing"]
  
  return {
    hasActiveSubscription: activeStatuses.includes(subscription.status as SubscriptionStatus),
    status: subscription.status as SubscriptionStatus,
    currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : null,
  }
}

export async function getUserProfile(userId: string) {
  if (!userId) return null

  const users = await sql`
    SELECT id, email, company_name, title, phone, profile_type, is_admin
    FROM users
    WHERE id = ${userId}
  `

  return users[0] || null
}
