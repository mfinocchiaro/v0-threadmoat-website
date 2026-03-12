import { sql } from '@/lib/db'
import { EXPLORER_TRIAL_PRODUCT } from '@/lib/explorer-trial'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'expired'
  | 'none'

export interface UserSubscription {
  hasActiveSubscription: boolean
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
  /** True when an Explorer trial has passed its end date */
  isExpiredTrial: boolean
  /** Days remaining on the current period (null if no subscription) */
  daysRemaining: number | null
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const rows = await sql`
    SELECT status, current_period_end, product_id
    FROM subscriptions
    WHERE user_id = ${userId}
  `
  const subscription = rows[0]

  if (!subscription) {
    return { hasActiveSubscription: false, status: 'none', currentPeriodEnd: null, isExpiredTrial: false, daysRemaining: null }
  }

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end as string)
    : null

  const now = new Date()
  const isTrialing = subscription.status === 'trialing'
  const isPastEnd = periodEnd ? periodEnd < now : false
  const isExplorerProduct = subscription.product_id === EXPLORER_TRIAL_PRODUCT || subscription.product_id === 'coupon_trial'

  // If trial period has elapsed, treat as expired
  if (isTrialing && isPastEnd) {
    return {
      hasActiveSubscription: false,
      status: 'expired',
      currentPeriodEnd: periodEnd,
      isExpiredTrial: isExplorerProduct,
      daysRemaining: 0,
    }
  }

  const daysRemaining = periodEnd
    ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : null

  const activeStatuses: SubscriptionStatus[] = ['active', 'trialing']

  return {
    hasActiveSubscription: activeStatuses.includes(subscription.status as SubscriptionStatus),
    status: subscription.status as SubscriptionStatus,
    currentPeriodEnd: periodEnd,
    isExpiredTrial: false,
    daysRemaining,
  }
}
