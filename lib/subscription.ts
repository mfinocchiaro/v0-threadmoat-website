import { sql } from '@/lib/db'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'none'

export interface UserSubscription {
  hasActiveSubscription: boolean
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const rows = await sql`
    SELECT status, current_period_end
    FROM subscriptions
    WHERE user_id = ${userId}
  `
  const subscription = rows[0]

  if (!subscription) {
    return { hasActiveSubscription: false, status: 'none', currentPeriodEnd: null }
  }

  const activeStatuses: SubscriptionStatus[] = ['active', 'trialing']

  return {
    hasActiveSubscription: activeStatuses.includes(subscription.status as SubscriptionStatus),
    status: subscription.status as SubscriptionStatus,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end as string)
      : null,
  }
}
